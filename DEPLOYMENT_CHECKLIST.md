# ✅ Checklist de Deployment para Railway

Usa esta lista para asegurarte de que todo está listo antes de deployar.

## Antes de Subir a GitHub

- [ ] El archivo `.env` está en `.gitignore`
- [ ] No hay tokens o información sensible en el código
- [ ] Todas las dependencias están en `package.json`
- [ ] El bot funciona correctamente en local
- [ ] Has probado los comandos principales

## Archivos Necesarios

- [ ] `package.json` - Con todas las dependencias
- [ ] `index.js` - Archivo principal del bot
- [ ] `.gitignore` - Incluye `.env`, `node_modules/`, `data/`
- [ ] `railway.json` - Configuración de Railway
- [ ] `Procfile` - Define el comando de inicio
- [ ] `README.md` - Documentación del proyecto

## Configuración de GitHub

- [ ] Repositorio creado en GitHub
- [ ] Repositorio es privado (si contiene datos sensibles)
- [ ] Git inicializado localmente (`git init`)
- [ ] Primer commit realizado
- [ ] Código subido a GitHub (`git push`)

## Configuración de Railway

- [ ] Cuenta creada en Railway.app
- [ ] GitHub conectado con Railway
- [ ] Proyecto creado desde el repositorio
- [ ] Variables de entorno configuradas:
  - [ ] `DISCORD_TOKEN`
  - [ ] `APPLICATION_ID`
- [ ] Start command configurado: `node index.js`

## Verificación del Bot en Discord

- [ ] Bot está en el servidor de prueba
- [ ] Intents están habilitados en Discord Developer Portal:
  - [ ] Presence Intent
  - [ ] Server Members Intent
  - [ ] Message Content Intent
- [ ] Permisos del bot son correctos
- [ ] URL de invitación tiene los permisos necesarios

## Después del Deployment

- [ ] Bot se conectó exitosamente (revisar logs)
- [ ] Comandos slash aparecen en Discord
- [ ] Probaste al menos 3 comandos diferentes
- [ ] Sistema de logs funciona
- [ ] Auto-moderación funciona (si está configurada)
- [ ] Eventos funcionan (si están configurados)

## Monitoreo

- [ ] Logs de Railway revisados
- [ ] No hay errores críticos
- [ ] Uso de recursos es normal
- [ ] Créditos gratuitos son suficientes

## Comandos de Prueba Recomendados

Prueba estos comandos después del deployment:

```
/ping
/botinfo
/userinfo
/serverinfo
/help
```

## Solución Rápida de Problemas

### Bot no se conecta:
1. Verifica `DISCORD_TOKEN` en Railway
2. Revisa los logs para ver el error específico
3. Asegúrate que el token es válido

### Comandos no aparecen:
1. Verifica `APPLICATION_ID` en Railway
2. Ejecuta `/sync` si el bot está online
3. Espera unos minutos (puede tardar)

### Bot se desconecta:
1. Revisa los logs en Railway
2. Verifica que no hayas agotado los créditos
3. Asegúrate que no hay errores en el código

## Notas Importantes

⚠️ **NUNCA** subas tu `.env` a GitHub
⚠️ **SIEMPRE** usa variables de entorno en Railway
⚠️ **MONITOREA** tu uso de créditos regularmente
⚠️ **HAZ BACKUPS** de tus datos importantes

## Recursos Útiles

- [Railway Docs](https://docs.railway.app)
- [Discord.js Guide](https://discordjs.guide)
- [Discord Developer Portal](https://discord.com/developers/applications)

---

Una vez completado todo, ¡tu bot estará corriendo 24/7 en Railway! 🎉
