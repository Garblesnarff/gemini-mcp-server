#!/usr/bin/env python3
import os
import shutil
import glob

def copy_directory_contents(src_dir, dest_dir):
    """Copy all contents from src_dir to dest_dir"""
    if not os.path.exists(src_dir):
        return
    
    # Create destination if it doesn't exist
    os.makedirs(dest_dir, exist_ok=True)
    
    # Copy all files and subdirectories
    for item in os.listdir(src_dir):
        src_path = os.path.join(src_dir, item)
        dest_path = os.path.join(dest_dir, item)
        
        if os.path.isdir(src_path):
            shutil.copytree(src_path, dest_path, dirs_exist_ok=True)
        else:
            shutil.copy2(src_path, dest_path)

def main():
    broken_dir = "/Users/rob/Claude/mcp-servers/gemini-mcp-server-BROKEN"
    current_dir = "/Users/rob/Claude/mcp-servers/gemini-mcp-server"
    
    print("🔧 Restoring advanced Gemini MCP Server code...")
    
    # Copy all markdown files
    print("📝 Copying documentation files...")
    for md_file in glob.glob(os.path.join(broken_dir, "*.md")):
        shutil.copy2(md_file, current_dir)
    
    # Copy all JavaScript files in root
    print("📜 Copying JavaScript files...")
    for js_file in glob.glob(os.path.join(broken_dir, "*.js")):
        shutil.copy2(js_file, current_dir)
    
    # Copy all JSON files
    print("⚙️ Copying configuration files...")
    for json_file in glob.glob(os.path.join(broken_dir, "*.json")):
        shutil.copy2(json_file, current_dir)
    
    # Copy shell scripts
    for sh_file in glob.glob(os.path.join(broken_dir, "*.sh")):
        shutil.copy2(sh_file, current_dir)
    
    # Copy directories
    print("📁 Copying directory structures...")
    
    # Remove old src and copy new one
    src_dest = os.path.join(current_dir, "src")
    if os.path.exists(src_dest):
        shutil.rmtree(src_dest)
    shutil.copytree(os.path.join(broken_dir, "src"), src_dest)
    
    # Copy data directory
    copy_directory_contents(os.path.join(broken_dir, "data"), os.path.join(current_dir, "data"))
    
    # Copy scripts directory
    copy_directory_contents(os.path.join(broken_dir, "scripts"), os.path.join(current_dir, "scripts"))
    
    # Copy .github directory if exists
    github_src = os.path.join(broken_dir, ".github")
    if os.path.exists(github_src):
        shutil.copytree(github_src, os.path.join(current_dir, ".github"), dirs_exist_ok=True)
    
    # Copy test audio file
    test_audio = os.path.join(broken_dir, "test-verbatim.mp3")
    if os.path.exists(test_audio):
        shutil.copy2(test_audio, current_dir)
    
    # Copy package.json and package-lock.json
    shutil.copy2(os.path.join(broken_dir, "package.json"), current_dir)
    if os.path.exists(os.path.join(broken_dir, "package-lock.json")):
        shutil.copy2(os.path.join(broken_dir, "package-lock.json"), current_dir)
    
    print("✅ Advanced code restoration complete!")
    print("   All files have been copied from BROKEN to current directory.")
    print("\n📌 Next steps:")
    print("   1. Stage all changes: git add .")
    print("   2. Commit: git commit -m 'feat: restore advanced Smart Tool Intelligence features'")
    print("   3. Push to GitHub: git push origin main")

if __name__ == "__main__":
    main()
