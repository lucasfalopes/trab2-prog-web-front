# Sistema de Gerenciamento de Ativos Hospitalares - Frontend

- Lucas Lopes - 2220647
- Diogo Marassi - 2220354

## Escopo do Projeto
Este projeto é o Frontend do sistema de gerenciamento de dispositivos hospitalares, que atua em conjunto com a nossa API Django.
Ele foi desenvolvido inteiramente com **HTML, CSS e JavaScript (com a base escrita totalmente em TypeScript)**. Não fizemos uso de nenhum framework pesado (como React ou Angular), atendendo à exigência de aplicar os conhecimentos práticos e puristas ensinados em sala de aula (Vanilla JS).

## O que foi desenvolvido
* **Autenticação:** Tela de login assíncrona, consumindo a API REST e gerenciando a sessão e acesso utilizando LocalStorage para o JWT.
* **Dashboards Específicos por Usuário:** 
  * **Painel do Médico:** Visão focada nas necessidades do médico, lidando com chamados e visualização do status do maquinário.
  * **Painel do Engenheiro:** Visão administrativa total com operações CRUD ativas e aba para aprovação de solicitações de troca de senha.
  * *Justificativa:* Cumprimos o requisito de permitir que diferentes usuários tenham visões diferentes do site com base em seu escopo de atuação.
* **Gerência de Senha:** Funcionalidades de "Esqueci minha Senha" via fluxo de chamados.
* **TypeScript:** Uso extenso de tipagem no código-fonte, posteriormente compilado para que os navegadores possam interpretá-lo de forma limpa.

## Como Instalar e Rodar Localmente (Instruções de Uso)

### Pré-requisitos
* Python para o backend e Node.js para compilar o frontend

### Passos
1. Clone o repositório:
   ```bash
   git clone <LINK_DO_REPO_FRONTEND>
   cd trab2-prog-web-front
   ```

2. Todos os arquivos transpilados do TypeScript já estão embutidos no diretório `dist/`. Basta iniciar um servidor HTTP simples na raiz do projeto:
   ```bash
   # Utilizando Python 3:
   python3 -m http.server 3000
   ```

3. Acesse em seu navegador a URL: `http://localhost:3000/index.html`

## Manual do Usuário
* Ao abrir o site, a primeira visão é a tela de **Login**. 

* Insira as suas credenciais. Se não as possuir, requisite ao Engenheiro local do sistema. Pare testes, os usuários criados pelas seed são:
   * **Engenheiro (Admin):** `username`: `engenheiro` | `password`: `Admin@12345`
   * **Médico:** `username`: `medico` | `password`: `Medico@12345`

* Uma vez logado, a aplicação dinamicamente identificará qual o seu tipo (Engenheiro ou Médico) e redirecionará para o Dashboard correto, limitando as funções do que você pode e não pode ver.

* Dentro do painel de Engenheiro, navegue utilizando as tabelas e botões para registrar um `Novo Dispositivo`, alterá-lo (botão de `Editar`) ou excluí-lo (botão de `Deletar`).

* Utilize a aba lateral ou superior para acessar a sessão de Aprovação de Senhas caso alguém tenha reportado o esquecimento.

* Para testar a redefição de senha:

1) Solicite como usuario comum sua redefinição na tela de login
2) Adicione o email cadastrado na conta

3) Depois disso, o administrador engenheiro receberá uma solicitação em sua interface e deverá aceitar a solicitação
4) Ao aceitar, ele receberá uma senha temporária para o usuário solicitante.

5) O médico solicitante deve efetuar o login usando essa senha temporária. Logo em seguida poderá atualizar sua senha para uma senha nova.

## Funcionalidades Testadas (Testes Manuais Realizados)

### O que funcionou (Testado e Aprovado)
* Login nativo com fetch e integração com o Backend 100% funcional.
* Redirecionamento dinâmico entre painéis e proteção das telas (não é possível acessar o dashboard.html digitando direto na URL sem um JWT no local storage).
* Operações completas de CRUD (Create, Read, Update, Delete) funcionando nas tabelas e se comunicando com o Django em tempo real.
* O fluxo completo de "Esqueci a senha" no front.
* O código TypeScript (que gerou a pasta dist/) e sua lógica, mantendo o HTML totalmente separado (sem poluição no DOM).