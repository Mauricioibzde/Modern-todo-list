# Modern Todo List

Esta aplicação é uma lista de tarefas moderna (Modern Todo List) desenvolvida para web, com recursos de organização, lembretes e notificações. Abaixo estão os principais pontos para entender o funcionamento e estrutura do projeto.

## Funcionalidades
- **Adicionar, editar e remover tarefas**
- **Agendamento de compromissos (Schedules)**
- **Categorias personalizadas para tarefas**
- **Lembretes automáticos de tarefas e compromissos próximos**
- **Notificações toast com barra de progresso animada**
- **Dashboard com métricas de tarefas (pendentes, concluídas, etc.)**
- **Pesquisa de tarefas**
- **Tema escuro/claro**
- **Interface responsiva para desktop e mobile**

## Estrutura de Pastas
```
front-end/
  index.html                # Página principal
  404.html                  # Página de erro
  src/
    imgs/                   # Imagens usadas na interface
    scripts/
      firebase-config.js    # Configuração do Firebase
      main.js               # Inicialização principal
      modules/              # Módulos JS organizados por funcionalidade
        alerts.js           # Toasts e notificações
        calendar.js         # Lógica de calendário
        ...                 # Outros módulos (formulários, dashboard, etc.)
      services/
        db.js               # Serviço de banco de dados (Firebase)
    styles/                 # CSS modularizado
      global.css            # Estilos globais
      notifications.css     # Estilos dos toasts e notificações
      ...                   # Outros arquivos de estilo
firebase.json               # Configuração do Firebase Hosting
```

## Principais Tecnologias
- **HTML5, CSS3 (modularizado)**
- **JavaScript (ES6+, módulos)**
- **Firebase (Hosting e Database)**

## Como funciona
- O usuário pode criar tarefas e compromissos, definir datas, horários e categorias.
- O sistema exibe lembretes automáticos para tarefas e compromissos próximos (até 3 dias).
- Notificações toast aparecem no topo direito, com barra de progresso animada e desaparecem automaticamente.
- O dashboard mostra métricas em tempo real.
- O tema pode ser alternado entre claro e escuro.

## Como rodar
1. Faça o deploy no Firebase Hosting ou abra o `index.html` em um servidor local.
2. Configure o arquivo `firebase-config.js` com suas credenciais do Firebase.
3. Acesse pelo navegador.

## Observações
- O projeto é totalmente front-end, salvo integração com Firebase.
- O código está modularizado para facilitar manutenção e expansão.

## Créditos
Desenvolvido por [Seu Nome].

---
Sinta-se à vontade para contribuir ou sugerir melhorias!
