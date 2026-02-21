# Aryza Radio App

Um aplicativo de rádio móvel simples construído com React Native e Expo, utilizando o `react-native-track-player` para gerenciar a reprodução de áudio em segundo plano e fornecer controles nativos (tela de bloqueio, fones de ouvido, etc).

## 🚀 Tecnologias Utilizadas

- **[React Native](https://reactnative.dev/)**: Framework para construção de aplicativos nativos.
- **[Expo](https://expo.dev/)**: Plataforma universal (framework e ferramentas) para React.
- **[TypeScript](https://www.typescriptlang.org/)**: Superset do JavaScript que adiciona tipagem estática.
- **[React Native Track Player](https://react-native-track-player.js.org/)**: Módulo nativo completo para controle de áudio, reprodução em segundo plano e controles na tela de bloqueio.

## 📦 Instalação e Execução

Como este projeto utiliza o `react-native-track-player`, que possui dependências de código nativo intensas, **ele não roda nativamente no aplicativo padrão gratuito "Expo Go"**. Você precisará compilar um "Custom Dev Client" para rodar e testar.

### Pré-requisitos
- Node.js instalado
- Ambiente de desenvolvimento React Native configurado (Android Studio para rodar no Android ou Xcode no Mac para rodar no iOS).

### Passo a passo

1. **Clone o repositório e instale as dependências:**
   ```bash
   git clone git@github.com:JulioAugustoS/aryza-radio-app.git
   cd radio
   npm install
   ```
   *(ou `yarn install` / `pnpm install`, dependendo do seu gerenciador de pacotes)*

2. **Para rodar no iOS (Requer Mac com Xcode):**
   ```bash
   npx expo run:ios
   ```
   Isso vai baixar os pods nativos, compilar o app iOS e iniciar o Metro Bundler.

3. **Para rodar no Android (Requer Android Studio configurado):**
   ```bash
   npx expo run:android
   ```
   Isso compilará o client de desenvolvimento em Java/Kotlin e o instalará no seu simulador ou dispositivo físico conectado, iniciando o Metro.

## 📻 Customizando a Rádio

Atualmente a rádio aponta para um endereço de demonstração. Vá até o arquivo `App.tsx` na variável `track` para mudar esses metadados:

```typescript
const track = {
  url: 'SUA_URL_DE_STREAM_AQUI', 
  title: 'Nome da Sua Rádio',
  artist: 'Ao Vivo',
  artwork: 'URL_DA_LOGO_AQUI',
};
```

## 🏗️ Estrutura principal do Projeto

- `/App.tsx`: Interface principal do aplicativo com o botão de Play/Pause.
- `/index.ts`: Ponto de entrada que registra o componente raiz e o `PlaybackService` para o player tocar no fundo.
- `/src/services/PlaybackService.ts`: Serviço que ouve eventos remotos (como o pause no fone de ouvido) quando o app está em 2º plano.
- `/src/services/TrackPlayerSetup.ts`: Responsável por inicializar e configurar os parâmetros do TrackPlayer no dispositivo.

---
Desenvolvido com ❤️
