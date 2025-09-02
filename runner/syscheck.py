import tempfile
import os
from modmii_wrapper import run_modmii_command


def get_syscheck_list(csv_str: str, stream_output=False, prompt_timeout=5):
    """
    Returns the list of wads the SysCheck Updater will install.

    Args:
        csv_str: CSV content as string for SysCheck Updater
        stream_output: If True, display output in real-time as it's generated
        auto_responses: Dict mapping prompt patterns to responses, or list of responses to give in order
        prompt_timeout: Seconds to wait for new output before considering it a prompt
        
    Returns:
        Dictionary with success, stdout, stderr, and returncode
    """


    with tempfile.NamedTemporaryFile('w', delete=False, suffix='.csv', encoding='utf-8') as tmpfile:
        tmpfile.write(csv_str)
        tmp_csv_path = tmpfile.name

    syscheck_responses = {
        r'Would you like to install.*Priiloader.*\(Y/N\)': 'Y',
        r'M = Main Menu': 'STOP',
    }

    result = run_modmii_command([tmp_csv_path], stream_output=stream_output, 
                                  auto_responses=syscheck_responses, prompt_timeout=prompt_timeout)
    
    print(result)
    
    if not result['success']:
        raise Exception(f"SysCheck listing failed: {result['stderr'] or result['stdout']}")
    
    dlnames_path = 'modmii/temp/DLnames.txt'
    
    if not os.path.exists(dlnames_path):
        raise Exception(f"DLnames.txt not found at expected location: {dlnames_path}")
    
    with open(dlnames_path, 'r', encoding='utf-8') as f:
        wad_list = [line.strip() for line in f if line.strip()]
    
    return wad_list


def syscheck_updater(csv_str: str, stream_output=False, prompt_timeout=5):
    """
    Run the SysCheck Updater with the specified CSV file.
    
    Args:
        csv_str: CSV content as string for SysCheck Updater
        stream_output: If True, display output in real-time as it's generated
        auto_responses: Dict mapping prompt patterns to responses, or list of responses to give in order
        prompt_timeout: Seconds to wait for new output before considering it a prompt
        
    Returns:
        Dictionary with success, stdout, stderr, and returncode
    """

    with tempfile.NamedTemporaryFile('w', delete=False, suffix='.csv', encoding='utf-8') as tmpfile:
        tmpfile.write(csv_str)
        tmp_csv_path = tmpfile.name

    syscheck_responses = {
        r'Would you like to install.*Priiloader.*\(Y/N\)': 'Y',
        r'Press any key to continue': '\n',
        r'\(Y/N\)': 'N',  # Default response for Y/N prompts
    }

    return run_modmii_command(['SU', tmp_csv_path], stream_output=stream_output, 
                                  auto_responses=syscheck_responses, prompt_timeout=prompt_timeout)

