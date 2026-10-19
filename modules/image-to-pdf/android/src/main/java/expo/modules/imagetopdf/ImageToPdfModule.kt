package expo.modules.imagetopdf

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.exifinterface.media.ExifInterface
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.exception.CodedException
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.InputStream

class ImageToPdfModule : Module() {
    private val context: Context
        get() = appContext.reactContext ?: throw CodedException("CONTEXT_ERROR", "Context is null", null)

    override fun definition() = ModuleDefinition {
        Name("ImageToPdf")

        // Convert images to PDF
        AsyncFunction("createPdf") { imageUris: List<String>, options: Map<String, Any?>, promise: Promise ->
            try {
                val fileName = options["fileName"] as? String ?: "images_${System.currentTimeMillis()}"
                val pageSize = options["pageSize"] as? String ?: "A4"
                val quality = (options["quality"] as? Number)?.toInt() ?: 90
                val fitMode = options["fitMode"] as? String ?: "contain"

                val (pageWidth, pageHeight) = when (pageSize) {
                    "A4" -> Pair(595, 842) // 72 DPI
                    "Letter" -> Pair(612, 792)
                    "A3" -> Pair(842, 1191)
                    "A5" -> Pair(420, 595)
                    else -> Pair(595, 842)
                }

                val pdfDocument = PdfDocument()
                
                for ((index, uriString) in imageUris.withIndex()) {
                    val bitmap = loadBitmapFromUri(uriString, quality)
                    if (bitmap != null) {
                        val pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, index + 1).create()
                        val page = pdfDocument.startPage(pageInfo)
                        val canvas = page.canvas

                        // Fill with white background
                        canvas.drawColor(Color.WHITE)

                        // Calculate scaling and positioning
                        val scaled = calculateScaledDimensions(
                            bitmap.width.toFloat(),
                            bitmap.height.toFloat(),
                            pageWidth.toFloat(),
                            pageHeight.toFloat(),
                            fitMode
                        )

                        // Center the image on page
                        val left = (pageWidth - scaled.first) / 2
                        val top = (pageHeight - scaled.second) / 2

                        val matrix = Matrix()
                        matrix.postScale(scaled.first / bitmap.width, scaled.second / bitmap.height)
                        matrix.postTranslate(left, top)

                        canvas.drawBitmap(bitmap, matrix, null)
                        pdfDocument.finishPage(page)
                        bitmap.recycle()
                    }
                }

                // Save to file
                val pdfUri = savePdfToFile(pdfDocument, fileName)
                pdfDocument.close()

                promise.resolve(mapOf(
                    "uri" to pdfUri,
                    "fileName" to "$fileName.pdf",
                    "pageCount" to imageUris.size
                ))
            } catch (e: Exception) {
                promise.reject(CodedException("PDF_ERROR", "Failed to create PDF: ${e.message}", e))
            }
        }

        // Save PDF to Downloads folder (Android 10+)
        AsyncFunction("savePdfToDownloads") { sourceUri: String, fileName: String, promise: Promise ->
            try {
                val savedUri = savePdfToDownloads(sourceUri, fileName)
                promise.resolve(mapOf(
                    "uri" to savedUri,
                    "fileName" to "$fileName.pdf",
                    "success" to true
                ))
            } catch (e: Exception) {
                promise.reject(CodedException("SAVE_ERROR", "Failed to save PDF: ${e.message}", e))
            }
        }

        // Merge multiple PDFs
        AsyncFunction("mergePdfs") { pdfUris: List<String>, fileName: String, promise: Promise ->
            try {
                val result = mergePdfFiles(pdfUris, fileName)
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject(CodedException("MERGE_ERROR", "Failed to merge PDFs: ${e.message}", e))
            }
        }

        // Convert PDF to images
        AsyncFunction("pdfToImages") { pdfUri: String, quality: Int, promise: Promise ->
            try {
                val result = convertPdfToImages(pdfUri, quality)
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject(CodedException("CONVERT_ERROR", "Failed to convert PDF: ${e.message}", e))
            }
        }

        // Compress PDF
        AsyncFunction("compressPdf") { pdfUri: String, quality: Int, promise: Promise ->
            try {
                val result = compressPdfFile(pdfUri, quality)
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject(CodedException("COMPRESS_ERROR", "Failed to compress PDF: ${e.message}", e))
            }
        }

        // Add watermark to PDF
        AsyncFunction("watermarkPdf") { pdfUri: String, watermarkText: String, options: Map<String, Any?>, promise: Promise ->
            try {
                val result = addWatermarkToPdf(pdfUri, watermarkText, options)
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject(CodedException("WATERMARK_ERROR", "Failed to add watermark: ${e.message}", e))
            }
        }

        // Edit PDF pages (delete, rotate, reorder)
        AsyncFunction("editPdfPages") { pdfUri: String, operations: List<Map<String, Any?>>, pageOrder: List<Int>, promise: Promise ->
            try {
                val result = editPdfPages(pdfUri, operations, pageOrder)
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject(CodedException("EDIT_ERROR", "Failed to edit PDF: ${e.message}", e))
            }
        }

        // Add text and image annotations to PDF
        AsyncFunction("annotatePdf") { pdfUri: String, annotations: List<Map<String, Any?>>, promise: Promise ->
            try {
                val result = annotatePdfContent(pdfUri, annotations)
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject(CodedException("ANNOTATE_ERROR", "Failed to annotate PDF: ${e.message}", e))
            }
        }
    }


    private fun loadBitmapFromUri(uriString: String, quality: Int): Bitmap? {
        try {
            val uri = Uri.parse(uriString)
            val inputStream: InputStream? = when {
                uriString.startsWith("content://") -> context.contentResolver.openInputStream(uri)
                uriString.startsWith("file://") -> FileInputStream(File(uri.path!!))
                else -> FileInputStream(File(uriString))
            }

            inputStream?.use { stream ->
                // First decode bounds
                val options = BitmapFactory.Options().apply {
                    inJustDecodeBounds = true
                }
                val bufferedStream = stream.buffered()
                bufferedStream.mark(Int.MAX_VALUE)
                BitmapFactory.decodeStream(bufferedStream, null, options)
                bufferedStream.reset()

                // Calculate sample size for memory efficiency
                options.inJustDecodeBounds = false
                options.inSampleSize = calculateInSampleSize(options, 2048, 2048)
                
                var bitmap = BitmapFactory.decodeStream(bufferedStream, null, options)
                
                // Handle EXIF rotation
                if (bitmap != null) {
                    bitmap = handleExifRotation(uri, bitmap)
                }
                
                return bitmap
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return null
    }

    private fun handleExifRotation(uri: Uri, bitmap: Bitmap): Bitmap {
        try {
            val inputStream = when {
                uri.scheme == "content" -> context.contentResolver.openInputStream(uri)
                else -> FileInputStream(File(uri.path!!))
            }
            
            inputStream?.use { stream ->
                val exif = ExifInterface(stream)
                val orientation = exif.getAttributeInt(
                    ExifInterface.TAG_ORIENTATION,
                    ExifInterface.ORIENTATION_NORMAL
                )
                
                val matrix = Matrix()
                when (orientation) {
                    ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
                    ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
                    ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
                    ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.preScale(-1f, 1f)
                    ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.preScale(1f, -1f)
                }
                
                if (!matrix.isIdentity) {
                    val rotated = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
                    if (rotated != bitmap) {
                        bitmap.recycle()
                    }
                    return rotated
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return bitmap
    }

    private fun calculateInSampleSize(options: BitmapFactory.Options, reqWidth: Int, reqHeight: Int): Int {
        val (height: Int, width: Int) = options.outHeight to options.outWidth
        var inSampleSize = 1

        if (height > reqHeight || width > reqWidth) {
            val halfHeight: Int = height / 2
            val halfWidth: Int = width / 2
            
            while (halfHeight / inSampleSize >= reqHeight && halfWidth / inSampleSize >= reqWidth) {
                inSampleSize *= 2
            }
        }
        return inSampleSize
    }

    private fun calculateScaledDimensions(
        imageWidth: Float,
        imageHeight: Float,
        pageWidth: Float,
        pageHeight: Float,
        fitMode: String
    ): Pair<Float, Float> {
        val margin = 20f
        val availableWidth = pageWidth - (margin * 2)
        val availableHeight = pageHeight - (margin * 2)

        val widthRatio = availableWidth / imageWidth
        val heightRatio = availableHeight / imageHeight

        val scale = when (fitMode) {
            "cover" -> maxOf(widthRatio, heightRatio)
            "contain" -> minOf(widthRatio, heightRatio)
            "fill" -> return Pair(availableWidth, availableHeight)
            else -> minOf(widthRatio, heightRatio)
        }

        return Pair(imageWidth * scale, imageHeight * scale)
    }

    private fun savePdfToFile(pdfDocument: PdfDocument, fileName: String): String {
        val cacheDir = context.cacheDir
        val pdfFile = File(cacheDir, "$fileName.pdf")
        FileOutputStream(pdfFile).use { out ->
            pdfDocument.writeTo(out)
        }
        return pdfFile.absolutePath
    }

    private fun savePdfToDownloads(sourceUri: String, fileName: String): String {
        val sourceFile = getFileFromUri(sourceUri)
        
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Use MediaStore for Android 10+
            val values = ContentValues().apply {
                put(MediaStore.Downloads.DISPLAY_NAME, "$fileName.pdf")
                put(MediaStore.Downloads.MIME_TYPE, "application/pdf")
                put(MediaStore.Downloads.IS_PENDING, 1)
            }
            
            val resolver = context.contentResolver
            val collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
            val itemUri = resolver.insert(collection, values) 
                ?: throw Exception("Failed to create MediaStore entry")
            
            resolver.openOutputStream(itemUri)?.use { out ->
                FileInputStream(sourceFile).use { input ->
                    input.copyTo(out)
                }
            }
            
            values.clear()
            values.put(MediaStore.Downloads.IS_PENDING, 0)
            resolver.update(itemUri, values, null, null)
            
            itemUri.toString()
        } else {
            // Legacy storage for older Android versions
            val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            val destFile = File(downloadsDir, "$fileName.pdf")
            sourceFile.copyTo(destFile, overwrite = true)
            destFile.absolutePath
        }
    }

    private fun mergePdfFiles(pdfUris: List<String>, fileName: String): Map<String, Any> {
        val outputDocument = PdfDocument()
        var totalPages = 0

        for (pdfUri in pdfUris) {
            val inputFile = getFileFromUri(pdfUri)
            val fileDescriptor = android.os.ParcelFileDescriptor.open(inputFile, android.os.ParcelFileDescriptor.MODE_READ_ONLY)
            val renderer = android.graphics.pdf.PdfRenderer(fileDescriptor)

            for (i in 0 until renderer.pageCount) {
                val page = renderer.openPage(i)
                val bitmap = Bitmap.createBitmap(page.width * 2, page.height * 2, Bitmap.Config.ARGB_8888)
                page.render(bitmap, null, null, android.graphics.pdf.PdfRenderer.Page.RENDER_MODE_FOR_PRINT)

                val pageInfo = PdfDocument.PageInfo.Builder(page.width * 2, page.height * 2, totalPages + 1).create()
                val newPage = outputDocument.startPage(pageInfo)
                newPage.canvas.drawBitmap(bitmap, 0f, 0f, null)
                outputDocument.finishPage(newPage)

                page.close()
                bitmap.recycle()
                totalPages++
            }

            renderer.close()
            fileDescriptor.close()
        }

        val outputFile = File(context.cacheDir, "$fileName.pdf")
        FileOutputStream(outputFile).use { outputDocument.writeTo(it) }
        outputDocument.close()

        return mapOf(
            "uri" to "file://${outputFile.absolutePath}",
            "fileName" to "$fileName.pdf",
            "pageCount" to totalPages
        )
    }

    private fun convertPdfToImages(pdfUri: String, quality: Int): Map<String, Any> {
        val inputFile = getFileFromUri(pdfUri)
        val fileDescriptor = android.os.ParcelFileDescriptor.open(inputFile, android.os.ParcelFileDescriptor.MODE_READ_ONLY)
        val renderer = android.graphics.pdf.PdfRenderer(fileDescriptor)
        val images = mutableListOf<String>()

        for (i in 0 until renderer.pageCount) {
            val page = renderer.openPage(i)
            val scale = 2f
            val bitmap = Bitmap.createBitmap(
                (page.width * scale).toInt(),
                (page.height * scale).toInt(),
                Bitmap.Config.ARGB_8888
            )
            page.render(bitmap, null, null, android.graphics.pdf.PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)

            val imageFile = File(context.cacheDir, "page_${i + 1}_${System.currentTimeMillis()}.jpg")
            FileOutputStream(imageFile).use { out ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, quality, out)
            }

            images.add("file://${imageFile.absolutePath}")
            page.close()
            bitmap.recycle()
        }

        val pageCount = renderer.pageCount
        renderer.close()
        fileDescriptor.close()

        return mapOf(
            "images" to images,
            "pageCount" to pageCount
        )
    }

    private fun compressPdfFile(pdfUri: String, quality: Int): Map<String, Any> {
        val inputFile = getFileFromUri(pdfUri)
        val originalSize = inputFile.length()

        val fileDescriptor = android.os.ParcelFileDescriptor.open(inputFile, android.os.ParcelFileDescriptor.MODE_READ_ONLY)
        val renderer = android.graphics.pdf.PdfRenderer(fileDescriptor)
        val outputDocument = PdfDocument()

        val qualityScale = quality / 100f

        for (i in 0 until renderer.pageCount) {
            val page = renderer.openPage(i)
            val scaledWidth = (page.width * qualityScale).toInt().coerceAtLeast(100)
            val scaledHeight = (page.height * qualityScale).toInt().coerceAtLeast(100)
            
            val bitmap = Bitmap.createBitmap(scaledWidth, scaledHeight, Bitmap.Config.ARGB_8888)
            page.render(bitmap, null, null, android.graphics.pdf.PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)

            val pageInfo = PdfDocument.PageInfo.Builder(scaledWidth, scaledHeight, i + 1).create()
            val newPage = outputDocument.startPage(pageInfo)
            newPage.canvas.drawBitmap(bitmap, 0f, 0f, null)
            outputDocument.finishPage(newPage)

            page.close()
            bitmap.recycle()
        }

        renderer.close()
        fileDescriptor.close()

        val outputFile = File(context.cacheDir, "compressed_${System.currentTimeMillis()}.pdf")
        FileOutputStream(outputFile).use { outputDocument.writeTo(it) }
        outputDocument.close()

        val compressedSize = outputFile.length()
        val savings = ((originalSize - compressedSize).toFloat() / originalSize * 100).toInt()

        return mapOf(
            "uri" to "file://${outputFile.absolutePath}",
            "originalSize" to originalSize,
            "compressedSize" to compressedSize,
            "savings" to savings
        )
    }

    private fun addWatermarkToPdf(pdfUri: String, watermarkText: String, options: Map<String, Any?>): Map<String, Any> {
        val inputFile = getFileFromUri(pdfUri)
        val fontSize = (options["fontSize"] as? Number)?.toFloat() ?: 48f
        val opacity = (options["opacity"] as? Number)?.toFloat() ?: 0.3f
        val rotation = (options["rotation"] as? Number)?.toFloat() ?: -45f
        val color = (options["color"] as? String) ?: "#888888"
        
        val fileDescriptor = android.os.ParcelFileDescriptor.open(inputFile, android.os.ParcelFileDescriptor.MODE_READ_ONLY)
        val renderer = android.graphics.pdf.PdfRenderer(fileDescriptor)
        val outputDocument = PdfDocument()
        
        // Parse color
        val paint = android.graphics.Paint().apply {
            this.color = android.graphics.Color.parseColor(color)
            this.alpha = (opacity * 255).toInt()
            this.textSize = fontSize
            this.isAntiAlias = true
            this.textAlign = android.graphics.Paint.Align.CENTER
        }

        for (i in 0 until renderer.pageCount) {
            val page = renderer.openPage(i)
            val bitmap = Bitmap.createBitmap(page.width * 2, page.height * 2, Bitmap.Config.ARGB_8888)
            page.render(bitmap, null, null, android.graphics.pdf.PdfRenderer.Page.RENDER_MODE_FOR_PRINT)
            
            // Draw watermark on bitmap
            val canvas = Canvas(bitmap)
            canvas.save()
            canvas.translate(bitmap.width / 2f, bitmap.height / 2f)
            canvas.rotate(rotation)
            
            // Draw text multiple times for pattern
            val textWidth = paint.measureText(watermarkText)
            val spacing = textWidth * 1.5f
            for (y in -3..3) {
                for (x in -2..2) {
                    canvas.drawText(watermarkText, x * spacing, y * spacing, paint)
                }
            }
            canvas.restore()

            val pageInfo = PdfDocument.PageInfo.Builder(page.width * 2, page.height * 2, i + 1).create()
            val newPage = outputDocument.startPage(pageInfo)
            newPage.canvas.drawBitmap(bitmap, 0f, 0f, null)
            outputDocument.finishPage(newPage)

            page.close()
            bitmap.recycle()
        }

        val pageCount = renderer.pageCount
        renderer.close()
        fileDescriptor.close()

        val outputFile = File(context.cacheDir, "watermarked_${System.currentTimeMillis()}.pdf")
        FileOutputStream(outputFile).use { outputDocument.writeTo(it) }
        outputDocument.close()

        return mapOf(
            "uri" to "file://${outputFile.absolutePath}",
            "pageCount" to pageCount
        )
    }

    private fun getFileFromUri(uriString: String): File {
        val uri = Uri.parse(uriString)
        
        return when (uri.scheme) {
            "file" -> File(uri.path!!)
            "content" -> {
                val inputStream = context.contentResolver.openInputStream(uri)
                    ?: throw Exception("Cannot open content URI")
                val tempFile = File(context.cacheDir, "temp_${System.currentTimeMillis()}.pdf")
                tempFile.outputStream().use { output ->
                    inputStream.copyTo(output)
                }
                inputStream.close()
                tempFile
            }
            else -> File(uriString)
        }
    }

    private fun editPdfPages(pdfUri: String, operations: List<Map<String, Any?>>, pageOrder: List<Int>): Map<String, Any> {
        val inputFile = getFileFromUri(pdfUri)
        val fileDescriptor = android.os.ParcelFileDescriptor.open(inputFile, android.os.ParcelFileDescriptor.MODE_READ_ONLY)
        val renderer = android.graphics.pdf.PdfRenderer(fileDescriptor)
        
        // Data class to track page with its original index
        data class PageData(val originalIndex: Int, var bitmap: Bitmap, var rotation: Int = 0, var deleted: Boolean = false)
        
        // Load all pages as bitmaps with their original indices
        val pages = mutableListOf<PageData>()
        for (i in 0 until renderer.pageCount) {
            val page = renderer.openPage(i)
            val bitmap = Bitmap.createBitmap(page.width * 2, page.height * 2, Bitmap.Config.ARGB_8888)
            page.render(bitmap, null, null, android.graphics.pdf.PdfRenderer.Page.RENDER_MODE_FOR_PRINT)
            pages.add(PageData(i, bitmap))
            page.close()
        }
        renderer.close()
        fileDescriptor.close()

        // Process delete and rotate operations
        for (op in operations) {
            when (op["type"] as? String) {
                "delete" -> {
                    val pageIndex = (op["pageIndex"] as? Number)?.toInt() ?: continue
                    pages.find { it.originalIndex == pageIndex }?.deleted = true
                }
                "rotate" -> {
                    val pageIndex = (op["pageIndex"] as? Number)?.toInt() ?: continue
                    val degrees = (op["degrees"] as? Number)?.toInt() ?: 90
                    pages.find { it.originalIndex == pageIndex }?.let {
                        it.rotation = (it.rotation + degrees) % 360
                    }
                }
            }
        }

        // Apply reordering based on pageOrder array if provided
        val orderedPages = if (pageOrder.isNotEmpty()) {
            // Create map for quick lookup
            val pageMap = pages.associateBy { it.originalIndex }
            // Build ordered list based on pageOrder
            pageOrder.mapNotNull { originalIndex -> pageMap[originalIndex] }
        } else {
            pages
        }

        // Create new PDF from non-deleted pages
        val outputDocument = PdfDocument()
        var pageNum = 1

        for (pageData in orderedPages) {
            if (pageData.deleted) {
                pageData.bitmap.recycle()
                continue
            }

            var bitmap = pageData.bitmap

            // Apply rotation if needed
            if (pageData.rotation != 0) {
                val matrix = Matrix()
                matrix.postRotate(pageData.rotation.toFloat())
                val rotated = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
                bitmap.recycle()
                bitmap = rotated
            }

            val pageInfo = PdfDocument.PageInfo.Builder(bitmap.width, bitmap.height, pageNum).create()
            val page = outputDocument.startPage(pageInfo)
            page.canvas.drawBitmap(bitmap, 0f, 0f, null)
            outputDocument.finishPage(page)
            bitmap.recycle()
            pageNum++
        }
        
        // Recycle any remaining bitmaps from pages that weren't in orderedPages
        pages.filter { p -> orderedPages.none { it.originalIndex == p.originalIndex } }.forEach { it.bitmap.recycle() }

        val outputFile = File(context.cacheDir, "edited_${System.currentTimeMillis()}.pdf")
        FileOutputStream(outputFile).use { outputDocument.writeTo(it) }
        outputDocument.close()

        return mapOf(
            "uri" to "file://${outputFile.absolutePath}",
            "pageCount" to (pageNum - 1)
        )
    }

    private fun annotatePdfContent(pdfUri: String, annotations: List<Map<String, Any?>>): Map<String, Any> {
        val inputFile = getFileFromUri(pdfUri)
        val fileDescriptor = android.os.ParcelFileDescriptor.open(inputFile, android.os.ParcelFileDescriptor.MODE_READ_ONLY)
        val renderer = android.graphics.pdf.PdfRenderer(fileDescriptor)
        val outputDocument = PdfDocument()

        // Group annotations by page
        val annotationsByPage = annotations.groupBy { (it["pageIndex"] as? Number)?.toInt() ?: 0 }

        for (i in 0 until renderer.pageCount) {
            val page = renderer.openPage(i)
            val bitmap = Bitmap.createBitmap(page.width * 2, page.height * 2, Bitmap.Config.ARGB_8888)
            page.render(bitmap, null, null, android.graphics.pdf.PdfRenderer.Page.RENDER_MODE_FOR_PRINT)
            
            val canvas = Canvas(bitmap)
            val pageAnnotations = annotationsByPage[i] ?: emptyList()

            for (annotation in pageAnnotations) {
                when (annotation["type"] as? String) {
                    "text" -> {
                        val x = ((annotation["x"] as? Number)?.toFloat() ?: 0f) * 2
                        val y = ((annotation["y"] as? Number)?.toFloat() ?: 0f) * 2
                        val text = annotation["text"] as? String ?: ""
                        val fontSize = ((annotation["fontSize"] as? Number)?.toFloat() ?: 24f) * 2
                        val color = annotation["color"] as? String ?: "#000000"

                        val paint = android.graphics.Paint().apply {
                            this.color = android.graphics.Color.parseColor(color)
                            this.textSize = fontSize
                            this.isAntiAlias = true
                        }
                        canvas.drawText(text, x, y, paint)
                    }
                    "image" -> {
                        val x = ((annotation["x"] as? Number)?.toFloat() ?: 0f) * 2
                        val y = ((annotation["y"] as? Number)?.toFloat() ?: 0f) * 2
                        val width = ((annotation["width"] as? Number)?.toFloat() ?: 100f) * 2
                        val height = ((annotation["height"] as? Number)?.toFloat() ?: 100f) * 2
                        val imageUri = annotation["imageUri"] as? String ?: continue

                        val imageBitmap = loadBitmapFromUri(imageUri, 90) ?: continue
                        val scaledBitmap = Bitmap.createScaledBitmap(imageBitmap, width.toInt(), height.toInt(), true)
                        canvas.drawBitmap(scaledBitmap, x, y, null)
                        imageBitmap.recycle()
                        scaledBitmap.recycle()
                    }
                }
            }

            val pageInfo = PdfDocument.PageInfo.Builder(bitmap.width, bitmap.height, i + 1).create()
            val newPage = outputDocument.startPage(pageInfo)
            newPage.canvas.drawBitmap(bitmap, 0f, 0f, null)
            outputDocument.finishPage(newPage)

            page.close()
            bitmap.recycle()
        }

        val pageCount = renderer.pageCount
        renderer.close()
        fileDescriptor.close()

        val outputFile = File(context.cacheDir, "annotated_${System.currentTimeMillis()}.pdf")
        FileOutputStream(outputFile).use { outputDocument.writeTo(it) }
        outputDocument.close()

        return mapOf(
            "uri" to "file://${outputFile.absolutePath}",
            "pageCount" to pageCount
        )
    }
}

