import os
import subprocess

MODMII_PATH = os.environ.get('MODMII_PATH', '/modmii')
MODMII_COMMAND = os.path.join(MODMII_PATH, 'Support', 'ModMii.bat')
WINE_SHELL = 'wine'
KILL_WINE = 'wineserver -k'


def run_command_with_output(args, output_str=None, debug=False):
    # print(f'Running command: {MODMII_COMMAND} {args}')
    # caller_id = output_str or (args.split(' ')[0] if args else 'modmii')
    # cmd = [WINE_SHELL, MODMII_COMMAND] + args.split()
    caller_id = 1
    cmd = [WINE_SHELL, MODMII_COMMAND] + ['-h']
    try:
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            stdout, stderr = proc.communicate(timeout=60)
        except subprocess.TimeoutExpired:
            subprocess.run(KILL_WINE, shell=True)
            raise Exception(f'[{caller_id}] Command timed out after 60 seconds')
        if 'Hit any key to use ModMii anyway' in stdout:
            proc.stdin.write('\n')
            if debug:
                print(f'[{caller_id}] Sent newline to continue ModMii execution.')
        if proc.returncode == 0:
            return f'[{caller_id}] Command "{MODMII_COMMAND} {args}" executed successfully. Output: {stdout}'
        else:
            raise Exception(f'[{caller_id}] Command "{MODMII_COMMAND} {args}" failed with code {proc.returncode}. Stderr: {stderr}')
    except Exception as e:
        raise e
