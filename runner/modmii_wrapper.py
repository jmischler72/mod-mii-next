import os
import subprocess
import sys
import tempfile
import threading
import time
import re
from queue import Queue, Empty

# Use the batch file instead of the exe for command-line operations
MODMII_COMMAND = os.path.abspath(os.path.join(os.path.dirname(__file__), 'modmii', 'Support', 'ModMii.bat'))

def run_modmii_command(args=None, stream_output=False, auto_responses=None, prompt_timeout=5):
    """
    Run ModMii command with arguments and return output.
    
    Args:
        args: String or list of arguments to pass to ModMii
        stream_output: If True, display output in real-time as it's generated
        auto_responses: Dict mapping prompt patterns to responses, or list of responses to give in order
        prompt_timeout: Seconds to wait for new output before considering it a prompt
        
    Returns:
        Dictionary with success, stdout, stderr, and returncode
    """
    if args is None:
        args = ['help']
    elif isinstance(args, str):
        args = args.split()
    
    caller_id = 1
    cmd = [MODMII_COMMAND] + args
    
    try:
        proc = subprocess.Popen(
            cmd, 
            stdin=subprocess.PIPE, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True,
            shell=True,
            bufsize=1,  # Line buffered
            universal_newlines=True
        )
        
        return _run_with_streaming(proc, caller_id, auto_responses, prompt_timeout, stream_output)
            
    except Exception as e:
        print(f'[{caller_id}] Error occurred: {e}')
        return {
            'success': False,
            'stdout': '',
            'stderr': str(e),
            'returncode': None
        }
        
def _run_with_streaming(proc, caller_id, auto_responses=None, prompt_timeout=5, stream_output=False):
    """Run process with real-time output streaming and prompt handling"""
    
    def read_output(stream, queue, stream_name):
        """Read from stream and put lines in queue"""
        try:
            buffer = ""
            while True:
                char = stream.read(1)
                if not char:
                    break
                buffer += char
                if char == '\n' or char == '\r':
                    if buffer.strip():
                        queue.put((stream_name, buffer.rstrip()))
                    buffer = ""
                elif len(buffer) > 200:  # Prevent excessive buffering
                    queue.put((stream_name, buffer.rstrip()))
                    buffer = ""
            if buffer.strip():
                queue.put((stream_name, buffer.rstrip()))
            stream.close()
        except Exception as e:
            queue.put((stream_name, f"Error reading {stream_name}: {e}"))

    # Initialize prompt handling
    if auto_responses is None:
        auto_responses = {}
    
    # Convert list of responses to indexed dict
    if isinstance(auto_responses, list):
        auto_responses = {i: response for i, response in enumerate(auto_responses)}
    
    response_index = 0  # For sequential responses
    
    # Common prompt patterns
    common_prompts = {
        r'\(Y/N\)': 'Y',
        r'\(y/n\)': 'y',
        r'Press any key': '\n',
        r'Continue\?': 'Y',
        r'Proceed\?': 'Y',
        r'Would you like to.*\?': 'Y'
    }
    
    # Create queues for stdout and stderr
    output_queue = Queue()
    
    # Start threads to read stdout and stderr
    stdout_thread = threading.Thread(target=read_output, args=(proc.stdout, output_queue, 'stdout'))
    stderr_thread = threading.Thread(target=read_output, args=(proc.stderr, output_queue, 'stderr'))
    
    stdout_thread.daemon = True
    stderr_thread.daemon = True
    
    stdout_thread.start()
    stderr_thread.start()
    
    # Collect all output
    all_stdout = []
    all_stderr = []
    
    # Process output in real-time with prompt detection
    last_output_time = time.time()
    timeout_counter = 0
    max_timeout_iterations = 1200  # 120 seconds with 0.1s intervals
    recent_output = []  # Keep track of recent output for prompt detection
    
    while stdout_thread.is_alive() or stderr_thread.is_alive() or not output_queue.empty() or proc.poll() is None:
        try:
            stream_name, line = output_queue.get(timeout=0.1)
            timeout_counter = 0  # Reset timeout counter when we get output
            last_output_time = time.time()
            
            # Display the line in real-time (if streaming is enabled)
            if stream_name == 'stdout':
                if stream_output:
                    print(f"[OUT] {line}")
                all_stdout.append(line)
                recent_output.append(line)
            elif stream_name == 'stderr':
                if stream_output:
                    print(f"[ERR] {line}")
                all_stderr.append(line)
                recent_output.append(line)
            
            # Keep only recent output for prompt detection (last 5 lines)
            if len(recent_output) > 5:
                recent_output.pop(0)
                
        except Empty:
            timeout_counter += 1
            
            # Check if we might be waiting for input (no output for prompt_timeout seconds)
            time_since_output = time.time() - last_output_time
            if time_since_output >= prompt_timeout and proc.poll() is None:
                print(f"[PROMPT] No output for {prompt_timeout}s, checking for prompts...")
                
                # Look for prompts in recent output
                recent_text = '\n'.join(recent_output[-3:])  # Check last 3 lines
                response = None
                
                # Check user-defined responses first
                for pattern, resp in auto_responses.items():
                    if isinstance(pattern, str) and re.search(pattern, recent_text, re.IGNORECASE):
                        response = resp
                        print(f"[PROMPT] Found pattern '{pattern}', responding with '{response}'")
                        break
                    elif isinstance(pattern, int) and pattern == response_index:
                        response = resp
                        print(f"[PROMPT] Using sequential response #{response_index}: '{response}'")
                        response_index += 1
                        break
                
                # Check common prompts if no user response found
                if response is None:
                    for pattern, resp in common_prompts.items():
                        if re.search(pattern, recent_text, re.IGNORECASE):
                            response = resp
                            print(f"[PROMPT] Detected common prompt pattern '{pattern}', responding with '{response}'")
                            break
                
                # Send response if found
                if response is not None:
                    try:
                        proc.stdin.write(response + '\n')
                        proc.stdin.flush()
                        last_output_time = time.time()  # Reset timeout
                        recent_output.append(f"[INPUT] {response}")
                    except Exception as e:
                        print(f"[PROMPT] Error sending response: {e}")
                else:
                    print(f"[PROMPT] No matching response found for recent output")
            
            # Overall timeout check
            if timeout_counter >= max_timeout_iterations:
                print(f'[{caller_id}] Command timed out after 120 seconds')
                proc.kill()
                break
            continue
    
    # Wait for threads to finish
    stdout_thread.join(timeout=1)
    stderr_thread.join(timeout=1)
    
    # Wait for process to complete
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait()
    
    return {
        'success': proc.returncode == 0,
        'stdout': '\n'.join(all_stdout),
        'stderr': '\n'.join(all_stderr),
        'returncode': proc.returncode
    }

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


