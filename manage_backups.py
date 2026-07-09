import os
import shutil
import zipfile
import glob
from datetime import datetime

project_dir = "/Users/gi/Documents/i-miei-pensieri"
backups_dir = os.path.join(project_dir, "backups")

def create_backup():
    if not os.path.exists(backups_dir):
        os.makedirs(backups_dir)
        
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_filename = os.path.join(backups_dir, f"backup_{timestamp}.zip")
    
    print(f"Creazione backup: {zip_filename}")
    
    exclude_dirs = {".git", ".firebase", "node_modules", "dist", "backups", ".agents", ".npm-cache", "Pods", "build", ".gradle", ".symlinks", "DerivedData", ".uploads"}
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(project_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                # Salta file compilati o pacchetti pesanti
                if file.endswith(".ipa") or file.endswith(".apk") or file.endswith(".zip") or file.endswith(".tar.gz"):
                    continue
                filepath = os.path.join(root, file)
                relpath = os.path.relpath(filepath, project_dir)
                # Verifica ulteriore sui segmenti del percorso
                path_parts = relpath.split(os.sep)
                if any(part in exclude_dirs for part in path_parts):
                    continue
                zipf.write(filepath, relpath)
                
    print(f"✅ Backup creato: {os.path.basename(zip_filename)}")
    rotate_backups()

def rotate_backups():
    """LIFO: mantieni massimo 5 backup, elimina il più vecchio se supera."""
    search_pattern = os.path.join(backups_dir, "backup_*.zip")
    backup_files = glob.glob(search_pattern)
    backup_files.sort(key=os.path.getmtime)  # dal più vecchio al più recente
    
    while len(backup_files) > 5:
        oldest_backup = backup_files.pop(0)  # rimuove il più vecchio
        try:
            os.remove(oldest_backup)
            print(f"🗑️  Backup eliminato (LIFO): {os.path.basename(oldest_backup)}")
        except Exception as e:
            print(f"Errore nella rimozione di {oldest_backup}: {e}")

def list_backups():
    search_pattern = os.path.join(backups_dir, "backup_*.zip")
    backup_files = sorted(glob.glob(search_pattern), key=os.path.getmtime, reverse=True)
    if not backup_files:
        print("Nessun backup presente.")
        return
    print(f"\n📦 Backup disponibili ({len(backup_files)}/5):")
    for i, f in enumerate(backup_files):
        size = os.path.getsize(f) / (1024 * 1024)
        mtime = datetime.fromtimestamp(os.path.getmtime(f)).strftime("%Y-%m-%d %H:%M:%S")
        print(f"  [{i+1}] {os.path.basename(f)} - {size:.1f} MB - {mtime}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "list":
        list_backups()
    else:
        create_backup()
        list_backups()
