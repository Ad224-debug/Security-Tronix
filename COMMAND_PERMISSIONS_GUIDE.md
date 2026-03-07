# 🔐 Guía de Permisos de Comandos

## ¿Qué es esto?

Un sistema que te permite controlar quién puede ver y usar comandos específicos del bot. Solo los usuarios/roles autorizados podrán ejecutar esos comandos.

## Comando Principal

### `/setcmdpermission`

**Permisos requeridos:** Administrador

Este comando te permite gestionar los permisos de cualquier comando del bot.

## Opciones Disponibles

### 1. **Add User** - Agregar Usuario
Permite que un usuario específico use el comando.

```
/setcmdpermission command:ban action:add_user user:@Usuario
```

### 2. **Add Role** - Agregar Rol
Permite que todos los usuarios con ese rol usen el comando.

```
/setcmdpermission command:kick action:add_role role:@Moderador
```

### 3. **Remove User** - Remover Usuario
Quita el permiso a un usuario específico.

```
/setcmdpermission command:ban action:remove_user user:@Usuario
```

### 4. **Remove Role** - Remover Rol
Quita el permiso a un rol.

```
/setcmdpermission command:kick action:remove_role role:@Moderador
```

### 5. **View Permissions** - Ver Permisos
Muestra quién tiene permisos para usar el comando.

```
/setcmdpermission command:ban action:view
```

### 6. **Clear All** - Limpiar Todo
Elimina todos los permisos personalizados del comando (vuelve a ser público).

```
/setcmdpermission command:ban action:clear
```

## Ejemplos de Uso

### Ejemplo 1: Comando exclusivo para staff
Quieres que solo el rol "Staff" pueda usar `/warn`:

```
/setcmdpermission command:warn action:add_role role:@Staff
```

### Ejemplo 2: Comando para usuarios específicos
Quieres que solo tú y otro admin puedan usar `/setlogs`:

```
/setcmdpermission command:setlogs action:add_user user:@Admin1
/setcmdpermission command:setlogs action:add_user user:@Admin2
```

### Ejemplo 3: Combinar usuarios y roles
Quieres que el rol "Moderador" y un usuario específico puedan usar `/timeout`:

```
/setcmdpermission command:timeout action:add_role role:@Moderador
/setcmdpermission command:timeout action:add_user user:@UsuarioEspecial
```

### Ejemplo 4: Ver quién tiene permisos
Para verificar quién puede usar `/ban`:

```
/setcmdpermission command:ban action:view
```

## Comportamiento del Sistema

### ✅ Acceso Permitido Cuando:
- El usuario está en la lista de usuarios autorizados
- El usuario tiene un rol de la lista de roles autorizados
- El usuario es Administrador (siempre tienen acceso)
- No hay permisos configurados para ese comando (público por defecto)

### ❌ Acceso Denegado Cuando:
- Hay permisos configurados Y el usuario no cumple ninguna condición de arriba
- El usuario verá: "❌ No tienes permiso para usar este comando"

## Notas Importantes

1. **Los administradores siempre tienen acceso** a todos los comandos, incluso si no están en la lista.

2. **Por defecto, todos los comandos son públicos** hasta que configures permisos para ellos.

3. **Una vez que agregas permisos a un comando**, solo las personas autorizadas podrán usarlo.

4. **Para hacer un comando público de nuevo**, usa la opción `clear` para eliminar todos los permisos.

5. **Los permisos se guardan en `config.json`** bajo la sección `commandPermissions`.

## Comandos que Puedes Restringir

Puedes usar este sistema con CUALQUIER comando del bot, por ejemplo:
- `event` - Crear eventos
- `warn` - Advertir usuarios
- `kick` - Expulsar usuarios
- `ban` - Banear usuarios
- `poll` - Crear encuestas
- `announce` - Hacer anuncios
- `setlogs` - Configurar logs
- Y cualquier otro comando...

## Estructura en config.json

```json
{
  "commandPermissions": {
    "GUILD_ID": {
      "ban": {
        "users": ["USER_ID_1", "USER_ID_2"],
        "roles": ["ROLE_ID_1"]
      },
      "warn": {
        "users": [],
        "roles": ["ROLE_ID_STAFF"]
      }
    }
  }
}
```
