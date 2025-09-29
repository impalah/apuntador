#!/bin/bash

# =============================================================================
# Build script for Apuntador macOS Desktop Application
# =============================================================================
# Este script automatiza la compilación de la aplicación Tauri para macOS
# Soporta diferentes arquitecturas y tipos de build
# =============================================================================

set -e  # Exit on any error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración por defecto
BUILD_TYPE="release"
TARGET_ARCH="universal"
GENERATE_DMG="true"
VERBOSE="false"
CLEAN_BUILD="false"

# Función para mostrar ayuda
show_help() {
    echo -e "${CYAN}🍎 Apuntador macOS Build Script${NC}"
    echo ""
    echo "Uso: $0 [OPCIONES]"
    echo ""
    echo "OPCIONES:"
    echo "  -t, --type TYPE          Tipo de build: release, debug (default: release)"
    echo "  -a, --arch ARCH          Arquitectura: universal, arm64, intel (default: universal)"
    echo "  -d, --dmg                Generar instalador DMG (default: true)"
    echo "  --no-dmg                 No generar instalador DMG"
    echo "  -c, --clean              Limpiar build anterior"
    echo "  -v, --verbose            Output verbose"
    echo "  -h, --help               Mostrar esta ayuda"
    echo ""
    echo "EJEMPLOS:"
    echo "  $0                                    # Build release universal con DMG"
    echo "  $0 --type debug --arch arm64          # Build debug para Apple Silicon"
    echo "  $0 --arch intel --no-dmg             # Build release Intel sin DMG"
    echo "  $0 --clean --verbose                 # Build con limpieza y output verbose"
    echo ""
    echo "ARQUITECTURAS:"
    echo "  universal    Binario universal (Apple Silicon + Intel)"
    echo "  arm64        Apple Silicon (M1/M2/M3) solamente"  
    echo "  intel        Intel x86_64 solamente"
}

# Función para logging con colores
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${PURPLE}🔄 $1${NC}"
}

# Función para verificar prerequisitos
check_prerequisites() {
    log_step "Verificando prerequisitos..."
    
    # Verificar que estamos en macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "Este script debe ejecutarse en macOS"
        exit 1
    fi
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js no está instalado"
        exit 1
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        log_error "npm no está instalado"
        exit 1
    fi
    
    # Verificar Rust
    if ! command -v rustc &> /dev/null; then
        log_error "Rust no está instalado. Instala desde: https://rustup.rs/"
        exit 1
    fi
    
    # Verificar Tauri CLI
    if ! command -v tauri &> /dev/null; then
        log_warning "Tauri CLI no encontrado globalmente, usando npx"
    fi
    
    # Verificar que estamos en el directorio correcto
    if [[ ! -f "package.json" ]] || [[ ! -d "src-tauri" ]]; then
        log_error "Ejecuta este script desde la raíz del proyecto Apuntador"
        exit 1
    fi
    
    log_success "Prerequisitos verificados"
}

# Función para instalar targets de Rust si es necesario
setup_rust_targets() {
    log_step "Configurando targets de Rust..."
    
    case $TARGET_ARCH in
        "universal")
            rustup target add aarch64-apple-darwin
            rustup target add x86_64-apple-darwin
            ;;
        "arm64")
            rustup target add aarch64-apple-darwin
            ;;
        "intel")
            rustup target add x86_64-apple-darwin
            ;;
    esac
    
    log_success "Targets de Rust configurados"
}

# Función para limpiar builds anteriores
clean_build() {
    if [[ "$CLEAN_BUILD" == "true" ]]; then
        log_step "Limpiando builds anteriores..."
        
        # Limpiar target de Rust
        if [[ -d "src-tauri/target" ]]; then
            rm -rf src-tauri/target
            log_info "Directorio src-tauri/target eliminado"
        fi
        
        # Limpiar dist de frontend
        if [[ -d "dist" ]]; then
            rm -rf dist
            log_info "Directorio dist eliminado"
        fi
        
        # Limpiar node_modules si es muy viejo
        if [[ -d "node_modules" ]]; then
            local node_modules_age=$(find node_modules -maxdepth 0 -mtime +7 2>/dev/null | wc -l)
            if [[ $node_modules_age -gt 0 ]]; then
                log_warning "node_modules tiene más de 7 días, considera: npm ci"
            fi
        fi
        
        log_success "Limpieza completada"
    fi
}

# Función para instalar dependencias
install_dependencies() {
    log_step "Instalando dependencias..."
    
    # Instalar dependencias de npm
    if [[ ! -d "node_modules" ]] || [[ "$CLEAN_BUILD" == "true" ]]; then
        npm ci --prefer-offline --no-audit
    else
        log_info "node_modules ya existe, omitiendo instalación"
    fi
    
    log_success "Dependencias instaladas"
}

# Función para compilar frontend
build_frontend() {
    log_step "Compilando frontend..."
    
    npm run build
    
    if [[ ! -d "dist" ]]; then
        log_error "Error al compilar frontend - directorio dist no creado"
        exit 1
    fi
    
    log_success "Frontend compilado"
}

# Función para compilar aplicación Tauri
build_tauri() {
    log_step "Compilando aplicación Tauri para $TARGET_ARCH ($BUILD_TYPE)..."
    
    local tauri_cmd=""
    if command -v tauri &> /dev/null; then
        tauri_cmd="tauri"
    else
        tauri_cmd="npx tauri"
    fi
    
    local build_args=""
    local npm_script=""
    
    # Configurar argumentos según el tipo de build y arquitectura
    case $BUILD_TYPE in
        "debug")
            build_args="--debug"
            ;;
        "release")
            build_args=""
            ;;
    esac
    
    case $TARGET_ARCH in
        "universal")
            if [[ "$BUILD_TYPE" == "release" ]]; then
                npm_script="tauri:build:mac"
            else
                build_args="$build_args --target universal-apple-darwin"
            fi
            ;;
        "arm64")
            if [[ "$BUILD_TYPE" == "release" ]]; then
                npm_script="tauri:build:mac"  # Por defecto builds ARM64
            else
                build_args="$build_args --target aarch64-apple-darwin"
            fi
            ;;
        "intel")
            if [[ "$BUILD_TYPE" == "release" ]]; then
                npm_script="tauri:build:mac-intel"
            else
                build_args="$build_args --target x86_64-apple-darwin"
            fi
            ;;
    esac
    
    # Ejecutar build
    if [[ -n "$npm_script" ]]; then
        if [[ "$VERBOSE" == "true" ]]; then
            log_info "Ejecutando: npm run $npm_script"
        fi
        npm run "$npm_script"
    else
        if [[ "$VERBOSE" == "true" ]]; then
            log_info "Ejecutando: $tauri_cmd build $build_args"
        fi
        $tauri_cmd build $build_args
    fi
    
    log_success "Aplicación Tauri compilada"
}

# Función para encontrar archivos generados
find_generated_files() {
    log_step "Buscando archivos generados..."
    
    local target_dir=""
    case $TARGET_ARCH in
        "universal")
            target_dir="universal-apple-darwin"
            ;;
        "arm64")
            target_dir="aarch64-apple-darwin"
            ;;
        "intel")
            target_dir="x86_64-apple-darwin"
            ;;
    esac
    
    local build_path="src-tauri/target/$target_dir/$BUILD_TYPE"
    
    echo -e "${CYAN}📁 Archivos generados:${NC}"
    echo ""
    
    # Buscar .app bundle
    local app_bundle=$(find "$build_path" -name "*.app" 2>/dev/null | head -1)
    if [[ -n "$app_bundle" ]]; then
        local app_size=$(du -sh "$app_bundle" | cut -f1)
        echo -e "  🍎 App Bundle: ${GREEN}$(basename "$app_bundle")${NC} ($app_size)"
        echo -e "     📍 $app_bundle"
    else
        log_warning "No se encontró .app bundle"
    fi
    
    # Buscar .dmg installer
    local dmg_file=$(find "$build_path" -name "*.dmg" 2>/dev/null | head -1)
    if [[ -n "$dmg_file" ]]; then
        local dmg_size=$(du -sh "$dmg_file" | cut -f1)
        echo -e "  💿 DMG Installer: ${GREEN}$(basename "$dmg_file")${NC} ($dmg_size)"
        echo -e "     📍 $dmg_file"
    else
        if [[ "$GENERATE_DMG" == "true" ]]; then
            log_warning "No se encontró instalador DMG"
        else
            log_info "Instalador DMG no solicitado"
        fi
    fi
    
    echo ""
}

# Función para mostrar información del sistema
show_system_info() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${CYAN}💻 Información del sistema:${NC}"
        echo -e "  macOS: $(sw_vers -productVersion)"
        echo -e "  Arquitectura: $(uname -m)"
        echo -e "  Node.js: $(node --version)"
        echo -e "  npm: $(npm --version)"
        echo -e "  Rust: $(rustc --version)"
        echo ""
    fi
}

# Parsear argumentos de línea de comandos
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            BUILD_TYPE="$2"
            shift 2
            ;;
        -a|--arch)
            TARGET_ARCH="$2"
            shift 2
            ;;
        -d|--dmg)
            GENERATE_DMG="true"
            shift
            ;;
        --no-dmg)
            GENERATE_DMG="false"
            shift
            ;;
        -c|--clean)
            CLEAN_BUILD="true"
            shift
            ;;
        -v|--verbose)
            VERBOSE="true"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validar argumentos
case $BUILD_TYPE in
    "release"|"debug")
        ;;
    *)
        log_error "Tipo de build inválido: $BUILD_TYPE (debe ser: release, debug)"
        exit 1
        ;;
esac

case $TARGET_ARCH in
    "universal"|"arm64"|"intel")
        ;;
    *)
        log_error "Arquitectura inválida: $TARGET_ARCH (debe ser: universal, arm64, intel)"
        exit 1
        ;;
esac

# Script principal
main() {
    echo -e "${PURPLE}🍎 Apuntador macOS Build Script${NC}"
    echo -e "${CYAN}================================${NC}"
    echo ""
    
    local start_time=$(date +%s)
    
    show_system_info
    check_prerequisites
    setup_rust_targets
    clean_build
    install_dependencies
    build_frontend
    build_tauri
    find_generated_files
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo -e "${GREEN}🎉 Build completado exitosamente!${NC}"
    echo -e "${CYAN}⏱️  Tiempo total: ${duration}s${NC}"
    echo ""
    echo -e "${YELLOW}📋 Configuración:${NC}"
    echo -e "  Tipo: $BUILD_TYPE"
    echo -e "  Arquitectura: $TARGET_ARCH"
    echo -e "  DMG: $GENERATE_DMG"
    echo ""
    echo -e "${BLUE}🚀 ¡Listo para distribución!${NC}"
}

# Ejecutar script principal
main "$@"