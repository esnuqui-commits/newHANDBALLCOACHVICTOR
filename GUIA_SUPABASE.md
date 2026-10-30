# Guía: acceso multiusuario real con Supabase

> **Estado: NO verificado y NO conectado a la app.** El archivo `supabase_schema.sql` está escrito pero no se ha podido ejecutar (no había PostgreSQL en el entorno de desarrollo). La app V2 no tiene todavía pantalla de inicio de sesión ni panel de administración. Esta guía prepara el terreno; faltan por construir esas pantallas y la capa de almacenamiento remoto (Fase 5 real) y probar la seguridad antes de usarlo con datos reales.

## 1. Qué cuentas necesitas y qué cuestan
Precios consultados el 29-oct-2026 en guías que citan la web oficial; **confírmalos en supabase.com/pricing**.
- **GitHub** (gratuita): solo guarda el código. **Nunca** subas copias ni datos.
- **Supabase**: plan gratuito (2 proyectos, 500 MB de base de datos, sin tarjeta) que **pausa el proyecto tras 7 días sin actividad**: sirve para desarrollar. Para uso real, plan **Pro: 25 $/mes por organización más uso**.
- Dominio propio y proveedor de correo: opcionales; el correo de invitaciones puede exigir uno propio.

## 2. Crear el proyecto de PRUEBA
1. supabase.com → **New project**. Región de la **UE** (Fráncfort, Irlanda o París). Guarda la contraseña de base de datos en un gestor de contraseñas.
2. **Authentication → Providers → Email**: desactiva **Allow new users to sign up** (registro cerrado: solo entran las personas que tú inviten).
3. **SQL Editor → New query**: pega `supabase_schema.sql` completo → **Run**. Anota cualquier error y no sigas hasta resolverlo.

## 3. Crear tu cuenta de superadministrador (una sola vez, a mano)
1. **Authentication → Users → Add user**: tu correo y una contraseña larga. Activa la verificación en dos pasos en tu cuenta cuando esté disponible.
2. En el SQL Editor, sigue las 2 sentencias comentadas al final de `supabase_schema.sql` (crear la organización y convertir tu perfil en `superadmin` y `active`).
3. Crea un **segundo superadministrador de reserva** igual y guarda sus credenciales fuera de línea: es tu procedimiento de recuperación del acceso administrativo.

## 4. Registrar y autorizar entrenadores
- **Invitar:** Authentication → Users → **Invite user** (correo). La cuenta nace **pendiente**: no ve datos hasta que la actives.
- **Activar / suspender / bloquear / revocar:** `select admin_set_status('<id usuario>', 'active' | 'suspended' | 'blocked');`
- **Asignar rol:** `select admin_set_role('<id>', 'coach' | 'collaborator' | 'superadmin');`
- **Dar acceso a un equipo:** `select admin_assign_team('<id usuario>', '<id equipo>', 'view' | 'edit');`
- **Solicitudes de acceso:** tabla `access_requests`.
- Cada acción queda en `audit_log`. La suspensión corta el acceso a los datos **al instante** (las reglas leen el estado real en cada consulta); además, cierra sus sesiones desde Authentication → Users.

## 5. Claves: qué es público y qué no
- La clave **anon / publishable** puede ir en el código: está pensada para ser pública y no da acceso por sí sola.
- La clave **service_role** y las contraseñas **nunca** van en el código, en el HTML ni en GitHub.

## 6. Pruebas de seguridad obligatorias (con 3 cuentas de prueba)
Crea: `admin`, `coachA`, `coachB`. Ejecútalas con la API de Supabase desde cada cuenta y anota el resultado:
1. coachA no puede leer filas de coachB (equipos, ejercicios personales, sesiones).
2. coachA no puede modificar ni borrar datos de coachB cambiando identificadores.
3. coachA no puede ejecutar `update profiles set role='superadmin'` ni cambiar su `status`.
4. coachA no puede ejecutar `admin_set_status`, `admin_set_role` ni `admin_assign_team`.
5. Tras `admin_set_status(coachA,'suspended')`, coachA recibe 0 filas y no puede escribir.
6. Un recurso con `scope='team'` solo lo ven los miembros del equipo; `view` no puede editar.
7. Un ejercicio `scope='org'` con `shared_edit=false` solo lo edita su autor.
8. Un usuario `pending` no ve nada.
**No uses el sistema con datos reales hasta que las 8 pasen.**

## 7. Datos de menores (RGPD)
No es asesoramiento jurídico. Recomendación técnica: **no subir el DNI** a la nube; fotos solo con consentimiento; región UE; firmar el acuerdo de tratamiento de datos del proveedor; posibilidad de borrar por completo los datos de una persona. El club debe decidirlo con su responsable de protección de datos. Algunas fuentes señalan que, al ser el proveedor una empresa estadounidense, pueden aplicarse leyes de ese país aunque los datos estén en la UE.

## 8. Qué falta por construir antes de que esto funcione
Pantalla de inicio de sesión · panel de administración (usuarios, estados, roles, equipos) · adaptador de almacenamiento remoto · migración de tu copia V8 a la nube · sincronización · pruebas de la sección 6.
