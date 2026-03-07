const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

class BackupSystem {
  constructor(client) {
    this.client = client;
    this.backupDir = path.join(__dirname, 'backups');
    this.dataDir = path.join(__dirname, 'data');
    
    // Crear directorio de backups si no existe
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Crear backup de todos los archivos importantes
   */
  async createBackup(guildId = null) {
    try {
      const timestamp = Date.now();
      const dateStr = new Date(timestamp).toISOString().split('T')[0];
      const backupName = `backup-${dateStr}-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);

      // Crear carpeta del backup
      fs.mkdirSync(backupPath, { recursive: true });

      const backedUpFiles = [];

      // Archivos a respaldar
      const filesToBackup = [
        'config.json',
        'warnings.json',
        'warn-config.json',
        'languages.json'
      ];

      // Respaldar archivos principales
      for (const file of filesToBackup) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
          const destPath = path.join(backupPath, file);
          fs.copyFileSync(filePath, destPath);
          backedUpFiles.push(file);
        }
      }

      // Respaldar carpeta data/
      if (fs.existsSync(this.dataDir)) {
        const dataBackupPath = path.join(backupPath, 'data');
        fs.mkdirSync(dataBackupPath, { recursive: true });
        
        const dataFiles = fs.readdirSync(this.dataDir);
        for (const file of dataFiles) {
          const srcPath = path.join(this.dataDir, file);
          const destPath = path.join(dataBackupPath, file);
          
          if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, destPath);
            backedUpFiles.push(`data/${file}`);
          }
        }
      }

      // Crear archivo de metadata
      const metadata = {
        timestamp,
        date: new Date(timestamp).toISOString(),
        files: backedUpFiles,
        guildId: guildId || 'all',
        version: '2.0.0'
      };

      fs.writeFileSync(
        path.join(backupPath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      console.log(`✅ Backup created: ${backupName}`);
      return { success: true, backupName, files: backedUpFiles.length };

    } catch (error) {
      console.error('Error creating backup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restaurar backup
   */
  async restoreBackup(backupName) {
    try {
      const backupPath = path.join(this.backupDir, backupName);

      if (!fs.existsSync(backupPath)) {
        return { success: false, error: 'Backup not found' };
      }

      // Leer metadata
      const metadataPath = path.join(backupPath, 'metadata.json');
      if (!fs.existsSync(metadataPath)) {
        return { success: false, error: 'Invalid backup: metadata not found' };
      }

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      const restoredFiles = [];

      // Restaurar archivos principales
      const mainFiles = ['config.json', 'warnings.json', 'warn-config.json', 'languages.json'];
      
      for (const file of mainFiles) {
        const srcPath = path.join(backupPath, file);
        if (fs.existsSync(srcPath)) {
          const destPath = path.join(__dirname, file);
          
          // Crear backup del archivo actual antes de sobrescribir
          if (fs.existsSync(destPath)) {
            const tempBackup = `${destPath}.pre-restore`;
            fs.copyFileSync(destPath, tempBackup);
          }
          
          fs.copyFileSync(srcPath, destPath);
          restoredFiles.push(file);
        }
      }

      // Restaurar carpeta data/
      const dataBackupPath = path.join(backupPath, 'data');
      if (fs.existsSync(dataBackupPath)) {
        if (!fs.existsSync(this.dataDir)) {
          fs.mkdirSync(this.dataDir, { recursive: true });
        }

        const dataFiles = fs.readdirSync(dataBackupPath);
        for (const file of dataFiles) {
          const srcPath = path.join(dataBackupPath, file);
          const destPath = path.join(this.dataDir, file);
          
          if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, destPath);
            restoredFiles.push(`data/${file}`);
          }
        }
      }

      console.log(`✅ Backup restored: ${backupName}`);
      return { success: true, backupName, files: restoredFiles.length, metadata };

    } catch (error) {
      console.error('Error restoring backup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Listar todos los backups disponibles
   */
  listBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return [];
      }

      const backups = fs.readdirSync(this.backupDir)
        .filter(name => name.startsWith('backup-'))
        .map(name => {
          const metadataPath = path.join(this.backupDir, name, 'metadata.json');
          
          if (fs.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            const stats = fs.statSync(path.join(this.backupDir, name));
            
            return {
              name,
              ...metadata,
              size: this.getDirectorySize(path.join(this.backupDir, name))
            };
          }
          
          return null;
        })
        .filter(backup => backup !== null)
        .sort((a, b) => b.timestamp - a.timestamp);

      return backups;

    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  /**
   * Eliminar backups antiguos (más de X días)
   */
  cleanupOldBackups(daysToKeep = 30) {
    try {
      const backups = this.listBackups();
      const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      let deletedCount = 0;

      for (const backup of backups) {
        if (backup.timestamp < cutoffTime) {
          const backupPath = path.join(this.backupDir, backup.name);
          this.deleteDirectory(backupPath);
          deletedCount++;
          console.log(`🗑️ Deleted old backup: ${backup.name}`);
        }
      }

      return { success: true, deleted: deletedCount };

    } catch (error) {
      console.error('Error cleaning up backups:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Eliminar un backup específico
   */
  deleteBackup(backupName) {
    try {
      const backupPath = path.join(this.backupDir, backupName);
      
      if (!fs.existsSync(backupPath)) {
        return { success: false, error: 'Backup not found' };
      }

      this.deleteDirectory(backupPath);
      console.log(`🗑️ Deleted backup: ${backupName}`);
      
      return { success: true };

    } catch (error) {
      console.error('Error deleting backup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener tamaño de un directorio
   */
  getDirectorySize(dirPath) {
    let size = 0;

    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        size += this.getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    }

    return size;
  }

  /**
   * Eliminar directorio recursivamente
   */
  deleteDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach(file => {
        const filePath = path.join(dirPath, file);
        
        if (fs.statSync(filePath).isDirectory()) {
          this.deleteDirectory(filePath);
        } else {
          fs.unlinkSync(filePath);
        }
      });
      
      fs.rmdirSync(dirPath);
    }
  }

  /**
   * Formatear tamaño en bytes a formato legible
   */
  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

module.exports = BackupSystem;
