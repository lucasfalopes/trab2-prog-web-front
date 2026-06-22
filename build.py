import re

with open('src/index.ts', 'r') as f:
    content = f.read()

# Strip typings
content = re.sub(r' as HTMLFormElement \| null', '', content)
content = re.sub(r' as HTMLElement \| null', '', content)
content = re.sub(r' as HTMLButtonElement \| null', '', content)
content = re.sub(r' as HTMLSelectElement \| null', '', content)
content = re.sub(r' as HTMLFormElement', '', content)
content = re.sub(r' as HTMLInputElement', '', content)
content = re.sub(r' as HTMLSelectElement', '', content)
content = re.sub(r'\(e: Event\)', '(e)', content)
content = re.sub(r'\(req: any\)', '(req)', content)
content = re.sub(r'\(window as any\)', 'window', content)
content = re.sub(r'export interface Device \{[^}]+\}', '', content)
content = re.sub(r'export async function fetchDevices\(status\?: string\): Promise<Device\[\]>', 'export async function fetchDevices(status)', content)
content = re.sub(r'export async function renderDevices\(statusFilter\?: string\)', 'export async function renderDevices(statusFilter)', content)
content = re.sub(r'\(device: Device\)', '(device)', content)
content = re.sub(r'const deviceMap = new Map<number, Device>\(\);', 'const deviceMap = new Map();', content)
content = re.sub(r'\(id: number, action: string\)', '(id, action)', content)
content = re.sub(r'\(id: number\)', '(id)', content)

with open('dist/index.js', 'w') as f:
    f.write(content)
