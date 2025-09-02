import os
import subprocess

MODMII_COMMAND = os.path.join('./modmii/ModMii.exe')

def run_command_with_output(args, output_str=None, debug=False):
    # print(f'Running command: {MODMII_COMMAND} {args}')
    # caller_id = output_str or (args.split(' ')[0] if args else 'modmii')
    # cmd = [WINE_SHELL, MODMII_COMMAND] + args.split()
    caller_id = 1
    cmd = [MODMII_COMMAND] + ['-h']
    try:
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            stdout, stderr = proc.communicate(timeout=60)
        except subprocess.TimeoutExpired:
            proc.kill()
            return {
                'success': False,
                'stdout': f'[{caller_id}] Command timed out after 60 seconds',
                'stderr': f'[{caller_id}] Command timed out after 60 seconds'
            }
        return {
            'success': proc.returncode == 0,
            'stdout': stdout,
            'stderr': stderr,
            'returncode': proc.returncode
        }
    except Exception as e:
        print(f'[{caller_id}] Error occurred: {e}')
        return {
            'success': False,
            'stdout': '',
            'stderr': str(e),
            'returncode': None
        }
