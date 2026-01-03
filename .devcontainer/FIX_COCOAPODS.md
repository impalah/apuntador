# [WARNING] Solución Rápida: Error de CocoaPods con Ruby

## El Problema

```
ERROR: Error installing cocoapods:
ffi requires Ruby version >= 3.0
The current ruby version is 2.6.10.210.
```

macOS incluye Ruby 2.6.10 por defecto, pero CocoaPods necesita Ruby >= 3.0.

---

## [OK] Solución (5 minutos)

### Paso 1: Instalar rbenv (gestor de versiones de Ruby)

**[WARNING] NO usar `brew install ruby`** - Instala Ruby 4.0.0 (inestable)

```bash
# Instalar rbenv y ruby-build
brew install rbenv ruby-build
```

### Paso 2: Configurar rbenv

```bash
# Añadir rbenv al PATH
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc
```

### Paso 3: Instalar Ruby 3.3.6 (versión estable)

```bash
# Instalar Ruby 3.3.6
rbenv install 3.3.6

# Establecer como versión global
rbenv global 3.3.6
```

### Paso 4: Verificar Ruby 3.3.x

```bash o muestra 4.0.0**:
```bash
# Cerrar y reabrir la terminal
# O ejecutar:
source ~/.zshrc

# Verificar que rbenv está activo
which ruby  # Debe mostrar: /Users/linus/.rbenv/shims/ruby
```

### Paso 5
# Cerrar y reabrir la terminal
# O ejecutar:
source ~/.zshrc
```

### Paso 4: Instalar CocoaPods

```bash
# Ahora debería funcionar:
gem install cocoapods
```

**Si obtienes error de permisos**, usa `--user-install`:
```bash
gem install cocoapods --user-install

# Añadir al PATH
echo 'export PATH="$HOME/.gem/ruby/3.3.0/bin:$PATH"' >> ~/.zshrc
source ~/6: Verificar

```bash
pod --version
```

**Debe mostrar**: `1.16.2` (o similar)

---

## [TARGET] Comandos Resumidos (Copiar y Pegar)

```bash
# 1. Si ya instalaste Ruby con Homebrew, desinstalarlo
brew uninstall ruby

# 2. Instalar rbenv
brew install rbenv ruby-build

# 3. Configurar rbenv
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc

# 4. Instalar Ruby 3.3.6
rbenv install 3.3.6
rbenv global 3.3.6

# 5. Verificar Ruby 3.3.6
ruby --version

# 6. Instalar CocoaPods
gem install cocoapods

# 7. Instalar CocoaPods
gem install cocoapods

# 5. Verificar CocoaPods
pod --version
```

---

## [CONFIG] Solución Alternativa: rbenv

Si prefieres gestionar múltiples versiones de Ruby:

```bash
# Instalar rbenv
brew install rbenv ruby-build

# Configurar rbenv
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc

# Instalar Ruby 3.3
rbenv install 3.3.0
rbenv global 3.3.0

# Verificar
ruby --version

# Instalar CocoaPods
gem install cocoapods
```

---

## [BUG] Troubleshooting

### "Si instalaste Ruby con Homebrew, desinstalarlo
brew uninstall ruby

# 3. Instalar rbenv
brew install rbenv ruby-build

# 4. Configurar rbenv
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc

# 5. Instalar Ruby 3.3.6
rbenv install 3.3.6
rbenv global 3.3.6

# 6. Verificar que usas Ruby 3.3.6
ruby --version    # Debe mostrar 3.3.6
which ruby        # Debe mostrar ~/.rbenv/shims/ruby

# 7. Instalar CocoaPods correctamente
gem install cocoapods

# 8rce ~/.zshrc

# 5. Verificar que usas Ruby 3.x
ruby --version    # Debe mostrar 3.x.x
which ruby        # Debe mostrar /opt/homebrew/opt/ruby/bin/ruby

# 6. Instalar CocoaPods correctamente
gem install cocoarbenv con Ruby 3.3.6 estable

### Error con Ruby 4.0.0 - "No such file or directory"

**Problema**: Instalaste Ruby 4.0.0 con Homebrew y obtienes:
```
No such file or directory @ rb_sysopen - /Users/linus/.local/share/gem/ruby/4.0.0/cache/...
```

**Causa**: Ruby 4.0.0 es una versión en desarrollo (inestable), no apta para producción.

**Solución**:
```bash
# 1. Desinstalar Ruby 4.0.0 de Homebrew
brew uninstall ruby

# 2. Instalar rbenv
brew install rbenv ruby-build

# 3. Configurar rbenv
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc

# 4. Instalar Ruby 3.3.6 (estable)
rbenv install 3.3.6
rbenv global 3.3.6

# 5. Verificar
ruby --version    # Debe mostrar 3.3.6

# 6. Instalar CocoaPods
gem install cocoapods
```

# 7. Verificar
pod --version     # Ahora debe funcionar
```

**Por qué pasa esto**: 
- El Ruby del sistema (2.6.10) instala gems en `/Library/Ruby/Gems/2.6.0/`
- Esa ubicación no está en el PATH por defecto
- Necesitas usar Ruby de Homebrew (3.x) que instala en ubicaciones accesibles

### Sigue mostrando Ruby 2.6.10

```bash
# Ver qué ruby se está usando
which ruby

# Debería mostrar:
# /opt/homebrew/opt/ruby/bin/ruby  (correcto)
# /usr/bin/ruby                     (incorrecto, es el del sistema)

# Si muestra /usr/bin/ruby:
# Revisar que añadiste el PATH correctamente
cat ~/.zshrc | grep ruby

# Recargar shell
source ~/.zshrc

# O cerrar y reabrir la terminal
```

### Error "command not found: brew"

```bash
# Instalar Homebrew primero
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### CocoaPods instalado pero "pod: command not found"

```bash
# Ver dónde se instaló
gem environment

# Añadir al PATH
echo 'export PATH="$HOME/.gem/ruby/3.3.0/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## [OK] Checklist

- [ ] `brew install ruby` completado
- [ ] PATH actualizado en `~/.zshrc`
- [ ] Terminal recargado (`source ~/.zshrc`)
- [ ] `ruby --version` muestra 3.x
- [ ] `gem install cocoapods` exitoso
- [ ] `pod --version` funciona

**¡Listo para desarrollo iOS!** [SUCCESS]
