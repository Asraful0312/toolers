import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Pdf from 'react-native-pdf';

export default function PdfViewerTool() {
    const [pdfSource, setPdfSource] = useState<{ uri: string; name: string } | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [inputPage, setInputPage] = useState('1');
    const { showToast } = useToast();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = useThemeColor({}, 'primary');

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            setPdfSource({ uri: file.uri, name: file.name });
            setPage(1);
            setInputPage('1');
            setIsLoading(true);
        } catch (err) {
            console.error(err);
            showToast('Failed to pick document', 'error');
        }
    };

    const closePdf = () => {
        setPdfSource(null);
        setPage(1);
        setTotalPages(0);
        setScale(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            setInputPage(newPage.toString());
        }
    };

    const handlePageSubmit = () => {
        const p = parseInt(inputPage, 10);
        if (!isNaN(p)) {
            handlePageChange(p);
        } else {
            setInputPage(page.toString());
        }
    };

    if (pdfSource) {
        return (
            <View style={[styles.container, { backgroundColor }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: cardColor, borderBottomColor: 'rgba(0,0,0,0.1)' }]}>
                    <TouchableOpacity onPress={closePdf} style={styles.iconBtn}>
                        <MaterialIcons name="arrow-back" size={24} color={textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
                        {pdfSource.name}
                    </Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => setScale(s => Math.max(0.5, s - 0.25))} style={styles.iconBtn}>
                            <MaterialIcons name="remove" size={20} color={textColor} />
                        </TouchableOpacity>
                        <Text style={[styles.zoomText, { color: textSecondaryColor }]}>{Math.round(scale * 100)}%</Text>
                        <TouchableOpacity onPress={() => setScale(s => Math.min(3, s + 0.25))} style={styles.iconBtn}>
                            <MaterialIcons name="add" size={20} color={textColor} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* PDF View */}
                <View style={styles.pdfContainer}>
                    {isLoading && (
                        <View style={styles.loader}>
                            <ActivityIndicator size="large" color={primaryColor} />
                        </View>
                    )}
                    <Pdf
                        source={{ uri: pdfSource.uri }}
                        page={page}
                        scale={scale}
                        onLoadComplete={(numberOfPages, filePath) => {
                            setTotalPages(numberOfPages);
                            setIsLoading(false);
                        }}
                        onPageChanged={(page, numberOfPages) => {
                            setPage(page);
                            setInputPage(page.toString());
                        }}
                        onError={(error) => {
                            console.error(error);
                            showToast('Error loading PDF', 'error');
                            setIsLoading(false);
                        }}
                        onPressLink={(uri) => {
                        }}
                        style={styles.pdf}
                        enablePaging={true}
                        spacing={10}
                    />
                </View>

                {/* Footer Controls */}
                <View style={[styles.footer, { backgroundColor: cardColor, borderTopColor: 'rgba(0,0,0,0.1)' }]}>
                    <TouchableOpacity
                        onPress={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                        style={[styles.navBtn, page <= 1 && styles.disabledBtn]}
                    >
                        <MaterialIcons name="chevron-left" size={28} color={page <= 1 ? textSecondaryColor : textColor} />
                    </TouchableOpacity>

                    <View style={styles.pageInputContainer}>
                        <TextInput
                            style={[styles.pageInput, { color: textColor, backgroundColor: 'rgba(0,0,0,0.05)' }]}
                            value={inputPage}
                            onChangeText={setInputPage}
                            onSubmitEditing={handlePageSubmit}
                            keyboardType="number-pad"
                            textAlign="center"
                        />
                        <Text style={[styles.pageTotal, { color: textSecondaryColor }]}> / {totalPages}</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages}
                        style={[styles.navBtn, page >= totalPages && styles.disabledBtn]}
                    >
                        <MaterialIcons name="chevron-right" size={28} color={page >= totalPages ? textSecondaryColor : textColor} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor, padding: 20 }]}>
            <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
                <MaterialIcons name="picture-as-pdf" size={64} color={"#ef4444"} />
                <Text style={[styles.emptyTitle, { color: textColor }]}>PDF Viewer</Text>
                <Text style={[styles.emptyDesc, { color: textSecondaryColor }]}>
                    Open PDF files to view, zoom, and navigate seamlessly.
                </Text>
                <TouchableOpacity
                    onPress={pickDocument}
                    style={[styles.pickBtn, { backgroundColor: "#ef4444" }]}
                >
                    <MaterialIcons name="folder-open" size={24} color="white" />
                    <Text style={styles.pickBtnText}>Select PDF File</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    headerTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    zoomText: {
        minWidth: 40,
        textAlign: 'center',
        fontSize: 12,
    },
    iconBtn: {
        padding: 8,
        borderRadius: 8,
    },
    pdfContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    loader: {
        position: 'absolute',
        zIndex: 1,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderTopWidth: 1,
    },
    navBtn: {
        padding: 8,
    },
    disabledBtn: {
        opacity: 0.5,
    },
    pageInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pageInput: {
        width: 50,
        height: 36,
        borderRadius: 8,
        fontSize: 14,
        fontWeight: '600',
        padding: 0,
    },
    pageTotal: {
        fontSize: 14,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        borderRadius: 20,
        gap: 16,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 8,
    },
    emptyDesc: {
        textAlign: 'center',
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    pickBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
    },
    pickBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
