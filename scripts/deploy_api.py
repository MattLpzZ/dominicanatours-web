#!/usr/bin/env python3
"""Deploy Dominicana Tour Node.js API to VPS container."""
import paramiko, base64, os

HOST      = '217.77.7.129'
USER      = 'root'
KEY       = r'C:\Users\MattLpzZ\.ssh\id_ed25519_leymaken'
LOCAL     = r'c:/Users/MattLpzZ/Downloads/REPOSITORIOS/web/dominicanatours-web/api'
CONTAINER = 'dominicantour_api'

FILES = {
    'package.json':     'package.json',
    'src/index.js':     'src/index.js',
}

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, key_filename=KEY)

def run(cmd, show=True):
    _, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if show and out: print(out[:800])
    if show and err and 'warn' not in err.lower() and 'notice' not in err.lower():
        print('ERR:', err[:400])
    return out

def upload(local_rel, remote_rel):
    local_path = os.path.join(LOCAL, local_rel.replace('/', os.sep))
    with open(local_path, 'rb') as f:
        content = f.read()
    b64 = base64.b64encode(content).decode()
    tmp = f'/tmp/dtapi_{os.path.basename(local_rel)}'
    run(f'> {tmp}', show=False)
    chunk = 40000
    for i in range(0, len(b64), chunk):
        run(f'echo -n {b64[i:i+chunk]} >> {tmp}', show=False)
    run(f'base64 -d {tmp} > {tmp}.out && rm {tmp}', show=False)
    run(f'docker cp {tmp}.out {CONTAINER}:/app/{remote_rel} && rm {tmp}.out')
    print(f'  OK {remote_rel}')

print('Uploading API files...')
for local_rel, remote_rel in FILES.items():
    upload(local_rel, remote_rel)

print('\nInstalling new packages inside container...')
run(f'docker exec {CONTAINER} npm install --omit=dev --prefix /app')

print('\nRestarting container...')
run(f'docker restart {CONTAINER}')

import time
time.sleep(3)
print('\nHealth check...')
out = run(f'curl -s http://127.0.0.1:8099/health')
print('Response:', out)

print('\nDone.')
ssh.close()
