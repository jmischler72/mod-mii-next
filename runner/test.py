from modmii_wrapper import  syscheck_updater


if __name__ == '__main__':
    print("=" * 70)
    print("PROMPT HANDLING DEMONSTRATION")
    print("=" * 70)
    
    # Test 1: SysCheck Updater with automatic responses
    print("\n1. Testing SysCheck Updater with automatic prompt responses:")
    print("-" * 50)
    
    
    try:
        with open('./tmp/default-syscheck.csv', 'r', encoding='utf-8') as f:
            syscheck_content = f.read()
        
        print("Running SysCheck Updater with auto-responses enabled...")
        result = syscheck_updater(
            syscheck_content, 
            stream_output=True, 
            prompt_timeout=3
        )
        
        print(f"\nResult: Success={result['success']}, ReturnCode={result['returncode']}")
        print(f"Output lines: {len(result['stdout'].split('\n')) if result['stdout'] else 0}")
        
    except FileNotFoundError:
        print("Syscheck file not found, skipping this test")


