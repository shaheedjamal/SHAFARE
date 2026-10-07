import { lazy, ComponentType, LazyExoticComponent } from 'react'
import {
  Calculator, Sigma, Binary, Percent, CalendarDays, HeartPulse, Landmark, Receipt, Tag, Coins, CalendarRange, Divide, Equal, TrendingUp, PiggyBank, Wallet,
  ArrowLeftRight, Ruler, Square, Box, Scale, Thermometer, Gauge, Timer, Database, Zap, Compass, Waves,
  FileImage, FilePlus2, Files, Scissors, RotateCw, ListOrdered, Droplets, FileText, Image, Minimize2, Maximize2, Crop, RefreshCw, Info,
  Braces, ShieldCheck, FileJson, Code, Hash, Clock, Regex, KeyRound, Fingerprint, Palette, FileCode, Lock, Dices, Shield,
  Type, CaseSensitive, Eraser, ArrowDownAZ, Repeat, Link, AlignLeft, ScanLine, QrCode, Globe, Tags, StickyNote, ListChecks, LucideIcon
} from 'lucide-react'

export interface Tool { id: string; name: string; desc: string; category: string; icon: LucideIcon; keywords: string; Component: LazyExoticComponent<ComponentType> }
export interface Cat { id: string; icon: LucideIcon; blurb: string; howto: string[] }

export const cats: Cat[] = [
  { id: 'Calculators', icon: Calculator, blurb: 'Everyday, scientific and programmer math.', howto: ['Enter your values or expression.', 'Results update instantly as you type.', 'Copy, share or save the result to Notes.'] },
  { id: 'Finance', icon: Landmark, blurb: 'Loans, interest, investments, tax and discounts.', howto: ['Fill in the amounts and rates.', 'See the total, the breakdown and a chart.', 'Copy or save the result to keep a record.'] },
  { id: 'Converters', icon: ArrowLeftRight, blurb: 'Twelve unit categories with instant swap.', howto: ['Enter a value and choose From and To units.', 'Use the swap button to reverse the conversion.', 'Copy the result or save it to Notes.'] },
  { id: 'PDF', icon: FileText, blurb: 'Merge, split, rotate, mark up and convert PDFs.', howto: ['Drop your file or browse from your device.', 'Adjust the options, then run the tool.', 'Download the result. Files never leave your device.'] },
  { id: 'Images', icon: Image, blurb: 'Resize, compress, crop, rotate and convert.', howto: ['Drop an image or browse from your device.', 'Adjust the options and compare Before and After.', 'Download the result. Processing happens in your browser.'] },
  { id: 'Developer', icon: Code, blurb: 'Formatters, encoders, decoders and debuggers.', howto: ['Paste your input into the editor.', 'Results appear instantly or when you press a button.', 'Copy, clear or download the output.'] },
  { id: 'Security', icon: Shield, blurb: 'Passwords, tokens, hashes and secure randomness.', howto: ['Choose your options.', 'Everything is generated with your browser’s secure random source.', 'Copy the result. Nothing is stored or sent anywhere.'] },
  { id: 'Text', icon: Type, blurb: 'Count, clean, sort and transform text.', howto: ['Paste or type your text.', 'The output updates as you type.', 'Copy it or download it as a file.'] },
  { id: 'Web', icon: Globe, blurb: 'QR codes, URLs, UTM links and meta tags.', howto: ['Enter your details or allow camera access to scan.', 'Review the generated result.', 'Copy it or download it.'] },
  { id: 'Productivity', icon: StickyNote, blurb: 'Notes and to-dos saved on your device.', howto: ['Add a note or task.', 'Changes save automatically on this device.', 'Sign in under Account to sync across devices.'] }
]

const L = (imp: () => Promise<Record<string, unknown>>, k: string) => lazy(() => imp().then((m) => ({ default: m[k] as ComponentType })))
const adv = () => import('./tools/Advanced'), calc = () => import('./tools/Calculators'), fin = () => import('./tools/Finance'), cv = () => import('./tools/Converter')
const pdf = () => import('./tools/Pdf'), img = () => import('./tools/Images'), dev = () => import('./tools/Dev'), sec = () => import('./tools/Security'), utl = () => import('./tools/Utils')
const txt = () => import('./tools/Text'), web = () => import('./tools/Web'), qr = () => import('./tools/Qr')
const T = (id: string, name: string, desc: string, category: string, icon: LucideIcon, keywords: string, Component: Tool['Component']): Tool => ({ id, name, desc, category, icon, keywords, Component })
const C = (cat: string, icon: LucideIcon): Tool => T(`${cat.toLowerCase()}-converter`, `${cat} Converter`, `Convert between ${Object.keys(cvCats[cat]).slice(0, 3).join(', ').toLowerCase()} and more.`, 'Converters', icon, `unit ${cat.toLowerCase()}`,
  lazy(() => cv().then((m) => ({ default: (m.conv_ as (c: string) => ComponentType)(cat) }))))
// Unit names for card descriptions only; the converters load their full tables lazily.
const cvCats: Record<string, Record<string, number>> = {
  Length: { Meters: 1, Feet: 1, Miles: 1 }, Area: { 'Square meters': 1, Acres: 1, Hectares: 1 }, Volume: { Liters: 1, Gallons: 1, Cups: 1 }, Weight: { Kilograms: 1, Pounds: 1, Ounces: 1 },
  Temperature: { Celsius: 1, Fahrenheit: 1, Kelvin: 1 }, Speed: { 'km/h': 1, mph: 1, knots: 1 }, Time: { Seconds: 1, Minutes: 1, Hours: 1 }, Data: { Bytes: 1, MB: 1, GB: 1 },
  Energy: { Joules: 1, Calories: 1, kWh: 1 }, Pressure: { Pascal: 1, Bar: 1, PSI: 1 }, Angle: { Degrees: 1, Radians: 1, Gradians: 1 }, Frequency: { Hertz: 1, kHz: 1, MHz: 1 }
}

export const tools: Tool[] = [
  T('advanced-calculator', 'Advanced Calculator', 'Basic, scientific, programmer and statistics modes with history.', 'Calculators', Calculator, 'math calc scientific programmer statistics', L(adv, 'Advanced')),
  T('scientific-calculator', 'Scientific Calculator', 'Trig, logs, powers, factorials and degree/radian mode.', 'Calculators', Sigma, 'sin cos tan log ln sqrt', L(adv, 'Scientific')),
  T('programmer-calculator', 'Programmer Calculator', 'Binary, octal, decimal and hex with bitwise operations.', 'Calculators', Binary, 'bin hex oct and or xor shift', L(adv, 'Programmer')),
  T('percentage', 'Percentage Calculator', 'Percent of, percent of total and percentage change.', 'Calculators', Percent, 'percent change increase decrease', L(calc, 'Percentage')),
  T('age', 'Age Calculator', 'Your exact age and days until your next birthday.', 'Calculators', CalendarDays, 'birthday date of birth', L(calc, 'Age')),
  T('bmi', 'BMI Calculator', 'Body mass index and your healthy weight range.', 'Calculators', HeartPulse, 'body mass health weight height', L(calc, 'Bmi')),
  T('date-difference', 'Date Difference Calculator', 'Days, weeks and months between two dates.', 'Calculators', CalendarRange, 'days between duration', L(calc, 'DateDiff')),
  T('ratio', 'Ratio Calculator', 'Simplify a ratio and compare two values.', 'Calculators', Divide, 'proportion aspect', L(calc, 'Ratio')),
  T('average', 'Average Calculator', 'Mean, median, mode and spread of a list of numbers.', 'Calculators', Equal, 'mean median mode statistics', L(calc, 'Average')),
  T('fraction', 'Fraction Calculator', 'Add, subtract, multiply and divide fractions.', 'Calculators', Divide, 'numerator denominator', L(calc, 'Fraction')),

  T('emi', 'Loan / EMI Calculator', 'Monthly EMI, total interest and payment breakdown.', 'Finance', Landmark, 'loan emi mortgage interest repayment', L(fin, 'Emi')),
  T('simple-interest', 'Simple Interest', 'Interest on a principal over time at a fixed rate.', 'Finance', Coins, 'interest principal', L(fin, 'SimpleInterest')),
  T('compound-interest', 'Compound Interest', 'Growth of an amount with periodic compounding.', 'Finance', TrendingUp, 'interest growth savings', L(fin, 'CompoundInterest')),
  T('sip', 'SIP Calculator', 'Future value of monthly investments.', 'Finance', PiggyBank, 'systematic investment mutual fund', L(fin, 'Sip')),
  T('gst', 'GST Calculator', 'Add or remove GST from any amount.', 'Finance', Receipt, 'tax vat', L(fin, 'Gst')),
  T('discount', 'Discount Calculator', 'Final price and savings after a discount.', 'Finance', Tag, 'sale offer price off', L(fin, 'Discount')),
  T('profit-loss', 'Profit & Loss', 'Profit or loss and its percentage.', 'Finance', Wallet, 'margin cost selling', L(fin, 'ProfitLoss')),
  T('tip', 'Tip Calculator', 'Tip and split a bill between people.', 'Finance', Coins, 'bill split restaurant', L(fin, 'Tip')),

  T('unit-converter', 'Unit Converter', 'All twelve unit categories in one converter.', 'Converters', ArrowLeftRight, 'convert units', L(cv, 'UnitConverter')),
  C('Length', Ruler), C('Area', Square), C('Volume', Box), C('Weight', Scale), C('Temperature', Thermometer), C('Speed', Gauge),
  C('Time', Timer), C('Data', Database), C('Energy', Zap), C('Pressure', Gauge), C('Angle', Compass), C('Frequency', Waves),

  T('pdf-to-image', 'PDF → Image', 'Turn every PDF page into a PNG image.', 'PDF', FileImage, 'pdf png convert pages', L(pdf, 'PdfToImage')),
  T('image-to-pdf', 'Image → PDF', 'Combine images into a single PDF.', 'PDF', FilePlus2, 'jpg png photos convert', L(pdf, 'ImageToPdf')),
  T('pdf-merge', 'Merge PDF', 'Join several PDFs into one document.', 'PDF', Files, 'combine join', L(pdf, 'Merge')),
  T('pdf-split', 'Split / Extract PDF Pages', 'Keep only the pages you choose.', 'PDF', Scissors, 'split extract pages range', L(pdf, 'Split')),
  T('pdf-rotate', 'Rotate PDF', 'Rotate every page by 90, 180 or 270 degrees.', 'PDF', RotateCw, 'turn orientation', L(pdf, 'RotatePdf')),
  T('pdf-page-numbers', 'PDF Page Numbers', 'Add page numbers to every page.', 'PDF', ListOrdered, 'numbering footer', L(pdf, 'PageNumbers')),
  T('pdf-watermark', 'PDF Watermark', 'Stamp diagonal text across every page.', 'PDF', Droplets, 'stamp confidential draft', L(pdf, 'Watermark')),
  T('pdf-metadata', 'PDF Metadata', 'Edit title, author, subject and keywords.', 'PDF', FileText, 'properties title author', L(pdf, 'Metadata')),

  T('image-resize', 'Image Resize', 'Resize to exact dimensions, keeping the ratio.', 'Images', Maximize2, 'dimensions scale width height', L(img, 'Resize')),
  T('image-compress', 'Image Compress', 'Shrink file size with a quality slider.', 'Images', Minimize2, 'optimize quality reduce size', L(img, 'Compress')),
  T('image-crop', 'Image Crop', 'Cut out an exact region of an image.', 'Images', Crop, 'trim', L(img, 'Crop')),
  T('image-rotate', 'Image Rotate', 'Rotate an image by 90, 180 or 270 degrees.', 'Images', RotateCw, 'turn', L(img, 'Rotate')),
  T('image-converter', 'Image Format Converter', 'Convert between PNG, JPG and WebP.', 'Images', RefreshCw, 'format png jpg webp', L(img, 'FormatConverter')),
  T('jpg-to-png', 'JPG → PNG', 'Convert JPG images to PNG.', 'Images', RefreshCw, 'jpeg', L(img, 'JpgToPng')),
  T('png-to-jpg', 'PNG → JPG', 'Convert PNG images to JPG.', 'Images', RefreshCw, 'jpeg', L(img, 'PngToJpg')),
  T('webp-converter', 'WebP Converter', 'Convert images to modern WebP.', 'Images', RefreshCw, 'webp', L(img, 'WebpConverter')),
  T('image-info', 'Image Dimensions & Metadata', 'Size, dimensions, type and basic file details.', 'Images', Info, 'metadata properties exif', L(img, 'ImageInfo')),

  T('json-formatter', 'JSON Formatter', 'Pretty-print JSON with clear error messages.', 'Developer', Braces, 'json beautify', L(dev, 'JsonFormat')),
  T('json-validator', 'JSON Validator', 'Check whether JSON is valid and see where it breaks.', 'Developer', ShieldCheck, 'json lint', L(dev, 'JsonValidate')),
  T('json-minifier', 'JSON Minifier', 'Strip whitespace from JSON.', 'Developer', FileJson, 'json compact', L(dev, 'JsonMinify')),
  T('base64-encode', 'Base64 Encoder', 'Encode text as Base64.', 'Developer', Lock, 'base64 encode', L(dev, 'Base64Encode')),
  T('base64-decode', 'Base64 Decoder', 'Decode Base64 back to text.', 'Developer', Lock, 'base64 decode', L(dev, 'Base64Decode')),
  T('url-encode', 'URL Encoder', 'Percent-encode text for use in URLs.', 'Developer', Link, 'url encode percent', L(dev, 'UrlEncode')),
  T('url-decode', 'URL Decoder', 'Decode percent-encoded text.', 'Developer', Link, 'url decode percent', L(dev, 'UrlDecode')),
  T('uuid', 'UUID Generator', 'Random version 4 identifiers.', 'Developer', Fingerprint, 'guid id', L(utl, 'Uuid')),
  T('timestamp', 'Timestamp Converter', 'Unix time to dates and back.', 'Developer', Clock, 'unix epoch date', L(dev, 'Timestamp')),
  T('regex-tester', 'Regex Tester', 'Test patterns and see matches and groups.', 'Developer', Regex, 'regular expression', L(dev, 'Regex')),
  T('color', 'Color Converter', 'HEX to RGB and HSL with a live preview.', 'Developer', Palette, 'hex rgb hsl picker', L(utl, 'Color')),
  T('jwt-decoder', 'JWT Decoder', 'Read a token’s header and payload locally.', 'Developer', KeyRound, 'jwt token json web', L(dev, 'Jwt')),
  T('markdown-preview', 'Markdown Preview', 'Write Markdown and see it rendered.', 'Developer', FileCode, 'md', L(dev, 'Markdown')),

  T('password', 'Password Generator', 'Strong random passwords with a strength meter.', 'Security', KeyRound, 'random secure generate', L(utl, 'Password')),
  T('password-strength', 'Password Strength Checker', 'Estimate how hard a password is to guess.', 'Security', ShieldCheck, 'entropy check', L(sec, 'PasswordStrength')),
  T('token-generator', 'Random Token Generator', 'Hex or Base64URL tokens from secure randomness.', 'Security', Dices, 'api key secret', L(sec, 'Token')),
  T('hash-generator', 'Hash / SHA-256 Generator', 'SHA-1, SHA-256, SHA-384 and SHA-512 hashes.', 'Security', Hash, 'sha256 sha checksum digest', L(dev, 'Hash')),
  T('secure-random', 'Secure Random Generator', 'Unbiased random numbers from a range.', 'Security', Dices, 'number dice', L(sec, 'SecureRandom')),

  T('word-counter', 'Word & Character Counter', 'Words, characters, sentences, paragraphs and reading time.', 'Text', Type, 'count character sentence paragraph reading', L(txt, 'Counter')),
  T('case-converter', 'Case Converter', 'Upper, lower, title, camel, snake and kebab case.', 'Text', CaseSensitive, 'uppercase lowercase', L(txt, 'CaseConverter')),
  T('remove-duplicates', 'Remove Duplicate Lines', 'Keep only the first copy of each line.', 'Text', Repeat, 'dedupe unique', L(txt, 'DedupeLines')),
  T('text-cleaner', 'Text Cleaner', 'Trim, collapse spaces and drop blank lines.', 'Text', Eraser, 'clean trim', L(txt, 'TextCleaner')),
  T('whitespace-remover', 'Whitespace Remover', 'Remove every space and line break.', 'Text', Eraser, 'spaces', L(txt, 'WhitespaceRemover')),
  T('sort-lines', 'Sort Lines', 'Sort alphabetically, numerically or by length.', 'Text', ArrowDownAZ, 'alphabetical order', L(txt, 'SortLines')),
  T('text-reverser', 'Text Reverser', 'Reverse the characters in your text.', 'Text', Repeat, 'backwards', L(txt, 'Reverser')),
  T('slug-generator', 'Slug Generator', 'Clean URL slugs from any title.', 'Text', Link, 'url permalink', L(txt, 'Slug')),
  T('lorem-ipsum', 'Lorem Ipsum Generator', 'Placeholder paragraphs on demand.', 'Text', AlignLeft, 'dummy placeholder', L(txt, 'Lorem')),

  T('qr-generator', 'QR Generator', 'Create a QR code and download it as PNG.', 'Web', QrCode, 'qr code', L(qr, 'QrGenerator')),
  T('qr-scanner', 'QR Scanner', 'Scan a QR code with your camera.', 'Web', ScanLine, 'qr camera decode', L(qr, 'QrScanner')),
  T('url-parser', 'URL Parser', 'Break a URL into host, path, query and parameters.', 'Web', Globe, 'query params', L(web, 'UrlParser')),
  T('utm-builder', 'UTM Builder', 'Tag campaign links for analytics.', 'Web', Link, 'campaign marketing', L(web, 'Utm')),
  T('meta-tags', 'Meta Tag Generator', 'SEO and social meta tags, ready to paste.', 'Web', Tags, 'seo open graph twitter', L(web, 'MetaTags')),
  T('keyword-extractor', 'Keyword Generator', 'Find the most-used keywords in your text.', 'Web', Tags, 'seo keywords', L(web, 'Keywords')),

  T('notes', 'Notes', 'Local-first notes with auto-save, pinning and search.', 'Productivity', StickyNote, 'write memo quick notes', lazy(() => import('./tools/Notes'))),
  T('todo', 'To-do List', 'A simple task list saved on your device.', 'Productivity', ListChecks, 'tasks checklist', lazy(() => import('./tools/Todo')))
]

export const byId = (id: string) => tools.find((t) => t.id === id)
export const catOf = (id: string) => cats.find((c) => c.id === id)!
export const inCat = (c: string) => tools.filter((t) => t.category === c)
export const search = (q: string) => {
  const toks = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!toks.length) return tools
  return tools.map((t) => ({ t, hay: `${t.name} ${t.desc} ${t.category} ${t.keywords}`.toLowerCase(), n: t.name.toLowerCase() }))
    .filter((x) => toks.every((k) => x.hay.includes(k))).sort((a, b) => Number(b.n.includes(toks[0])) - Number(a.n.includes(toks[0])) || Number(b.n.startsWith(toks[0])) - Number(a.n.startsWith(toks[0]))).map((x) => x.t)
}
