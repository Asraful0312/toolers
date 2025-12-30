export const CATEGORIES = [
  { id: 'text', name: 'Text Tools', desc: 'Format, Count, Case', icon: 'text-fields', color: '#3b82f6', bg: '#eff6ff', darkBg: 'rgba(30, 58, 138, 0.2)' },
  { id: 'image', name: 'Image Tools', desc: 'Resize, Crop, Edit', icon: 'image', color: '#a855f7', bg: '#f3e8ff', darkBg: 'rgba(88, 28, 135, 0.2)' },
  { id: 'pdf', name: 'PDF Tools', desc: 'Convert, Merge, Split', icon: 'picture-as-pdf', color: '#ef4444', bg: '#fef2f2', darkBg: 'rgba(127, 29, 29, 0.2)' },
  { id: 'calc', name: 'Calculation', desc: 'Algebra, Finance', icon: 'functions', color: '#22c55e', bg: '#f0fdf4', darkBg: 'rgba(20, 83, 45, 0.2)' },
  { id: 'converter', name: 'Converter', desc: 'Length, Weight, Temp', icon: 'swap-horiz', color: '#f97316', bg: '#fff7ed', darkBg: 'rgba(124, 45, 18, 0.2)' },
  { id: 'dev', name: 'Dev Tools', desc: 'JSON, Base64, Hash', icon: 'code', color: '#64748b', bg: '#f1f5f9', darkBg: '#334155' },
  { id: 'color', name: 'Color Tools', desc: 'Picker, Palettes', icon: 'colorize', color: '#ec4899', bg: '#fdf2f8', darkBg: 'rgba(131, 24, 67, 0.2)' },
  { id: 'random', name: 'Randomizer', desc: 'Dice, Numbers, Lists', icon: 'shuffle', color: '#14b8a6', bg: '#f0fdfa', darkBg: 'rgba(19, 78, 74, 0.2)' },
  { id: 'utility', name: 'Utilities', desc: 'QR Code, Password', icon: 'build', color: '#6366f1', bg: '#eef2ff', darkBg: 'rgba(79, 70, 229, 0.2)' },
];

export const TOOLS = {
  text: [
    { id: 'char-counter', name: 'Character Counter', desc: 'Count characters, words, lines', icon: 'abc' },
    { id: 'case-converter', name: 'Case Converter', desc: 'Uppercase, Lowercase, Title Case', icon: 'text-format' },
    { id: 'lorem-ipsum', name: 'Lorem Ipsum Generator', desc: 'Generate placeholder text', icon: 'description' },
    { id: 'find-replace', name: 'Find & Replace', desc: 'Search and replace text', icon: 'find-replace' },
    { id: 'sort-lines', name: 'Sort Lines', desc: 'Sort, shuffle, or reverse lines', icon: 'sort' },
    { id: 'reverse-text', name: 'Reverse Text', desc: 'Reverse text, words, or lines', icon: 'swap-horiz' },
    { id: 'text-cleaner', name: 'Text Cleaner', desc: 'Remove spaces, duplicates, empty', icon: 'cleaning-services' },
    { id: 'add-numbers', name: 'Add Numbers', desc: 'Number lines with various styles', icon: 'format-list-numbered' },
    { id: 'repeat-text', name: 'Repeat Text', desc: 'Repeat text multiple times', icon: 'repeat' },
    { id: 'prefix-suffix', name: 'Prefix & Suffix', desc: 'Add text before/after lines', icon: 'playlist-add' },
    { id: 'text-encoder', name: 'Text Encoder', desc: 'Base64, URL, HTML encode/decode', icon: 'code' },
    { id: 'stylish-text', name: 'Stylish Text', desc: 'Bold, italic, fancy fonts', icon: 'font-download' },
    { id: 'text-diff', name: 'Text Compare', desc: 'Compare and find differences', icon: 'compare' },
  ],
  image: [
    { id: 'resize', name: 'Resize Image', desc: 'Change image dimensions', icon: 'aspect-ratio' },
    { id: 'crop', name: 'Crop Image', desc: 'Crop image to specific ratio', icon: 'crop' },
    { id: 'image-format', name: 'Format Converter', desc: 'Convert to JPEG, PNG, WebP', icon: 'transform' },
    { id: 'image-compress', name: 'Compress Image', desc: 'Reduce image file size', icon: 'compress' },
    { id: 'image-shape', name: 'Image Shape', desc: 'Circle, rounded, square shapes', icon: 'crop-free' },
    { id: 'image-rotate', name: 'Rotate & Flip', desc: 'Rotate and mirror images', icon: 'rotate-right' },
    { id: 'image-filter', name: 'Image Filters', desc: 'Grayscale, sepia, warm, cool', icon: 'filter' },
    { id: 'add-text', name: 'Add Text', desc: 'Add text overlay to images', icon: 'text-fields' },
    { id: 'meme-generator', name: 'Meme Generator', desc: 'Create memes with text', icon: 'mood' },
    { id: 'social-resizer', name: 'Social Resizer', desc: 'Resize for Instagram, FB, etc', icon: 'share' },
    { id: 'collage-maker', name: 'Collage Maker', desc: 'Combine multiple images', icon: 'dashboard' },
    { id: 'image-info', name: 'Image Info', desc: 'View image metadata & details', icon: 'info-outline' },
  ],
  pdf: [
    { id: 'image-to-pdf', name: 'Image to PDF', desc: 'Convert images to PDF document', icon: 'add-photo-alternate' },
    { id: 'text-to-pdf', name: 'Text to PDF', desc: 'Convert text notes to PDF', icon: 'description' },
  ],
  calc: [
    { id: 'calculator', name: 'Calculator', desc: 'Basic & Scientific Calculator', icon: 'calculate' },
    { id: 'percentage', name: 'Percentage', desc: 'Calculate percentages', icon: 'percent' },
  ],
  converter: [
    { id: 'unit-converter', name: 'Unit Converter', desc: 'Length, Weight, Volume, etc.', icon: 'scale' },
  ],
  dev: [
    { id: 'json-formatter', name: 'JSON Formatter', desc: 'Beautify & Minify JSON', icon: 'data-object' },
  ],
  color: [
    { id: 'color-picker', name: 'Color Picker', desc: 'Pick colors from image or wheel', icon: 'palette' },
    { id: 'image-color-picker', name: 'Image Color Picker', desc: 'Extract colors from images', icon: 'colorize' },
    { id: 'blend-colors', name: 'Blend Colors', desc: 'Create smooth color gradients', icon: 'gradient' },
  ],
  random: [
    { id: 'random-number', name: 'Random Number', desc: 'Generate random numbers', icon: 'casino' },
  ],
  utility: [
    { id: 'qr-code', name: 'QR Code', desc: 'Generate & scan QR codes', icon: 'qr-code' },
    { id: 'password-gen', name: 'Password Generator', desc: 'Create secure passwords', icon: 'vpn-key' },
  ],
};

