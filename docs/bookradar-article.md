## Title

Construindo o BookRadar: aprendendo Ruby on Rails com uma aplicação de biblioteca pessoal

## Slug

`construindo-bookradar-aprendendo-ruby-on-rails`

## Excerpt

Como um projeto de biblioteca pessoal combinou Ruby on Rails, React e a Open Library para transformar o estudo de uma stack em uma aplicação funcional, com decisões técnicas, testes e aprendizados concretos.

## Cover Image

Imagem recomendada: `post - biblioteca.png` (anexo 3).

Texto alternativo sugerido: “Dashboard do BookRadar exibindo métricas da biblioteca, livros em leitura, favoritos e livros adicionados recentemente em tema escuro.”

## Content

Minha trajetória profissional tem uma base mais próxima do frontend, especialmente de React, Next.js e TypeScript. Ao ampliar esse repertório em direção ao backend, o Ruby on Rails apareceu como uma oportunidade interessante: construir uma aplicação concreta e, ao longo do caminho, comparar outra forma de organizar rotas, regras, integrações e testes.

O resultado desse processo foi o **BookRadar**, um projeto educacional para pesquisar livros e manter uma biblioteca pessoal de leitura. Ele não nasceu como um produto comercial. Sua função foi servir de espaço para aplicar conceitos de Rails em um fluxo que tivesse começo, meio e fim: consultar um catálogo externo, apresentar resultados e permitir que o usuário acompanhe os livros que deseja ler.

## O problema que o BookRadar procura resolver

Encontrar um livro é apenas uma parte da experiência de leitura. Depois da descoberta, é comum querer guardar a obra, registrar se ela está na fila, em andamento ou já concluída e manter algumas impressões pessoais.

O BookRadar reúne essas duas etapas:

1. **Descoberta:** pesquisar o catálogo da Open Library.
2. **Organização:** manter uma biblioteca local com status, favoritos, avaliação e observações.

A aplicação parte de uma interface de busca simples. Durante a digitação, o frontend aguarda 400 milissegundos antes de disparar a consulta, evitando uma requisição para cada tecla pressionada. Os resultados podem ser paginados e adicionados à biblioteca.

Na biblioteca, cada livro pode receber um dos três estados:

- Quero ler
- Lendo
- Lido

Também é possível marcar favoritos, atribuir uma avaliação de 1 a 5 estrelas e adicionar uma nota pessoal. O dashboard resume os totais e organiza destaques de leitura atual, favoritos e itens adicionados recentemente.

## Arquitetura: duas aplicações com responsabilidades claras

O repositório separa o frontend e o backend:

```text
bookradar/
├── backend/   # Ruby on Rails em modo API
└── frontend/  # React + TypeScript
```

Essa divisão é importante porque deixa explícito o papel de cada lado:

- o **Rails** publica e protege um contrato JSON, valida parâmetros e conversa com a Open Library;
- o **React** cuida da experiência de busca, dos estados visuais e do gerenciamento da biblioteca;
- o **localStorage** guarda os dados pessoais da biblioteca no navegador.

O frontend não chama diretamente a Open Library. Ele pede resultados à API do BookRadar:

```text
GET /api/v1/books/search?q=ruby&page=1&per_page=10
```

Em desenvolvimento, o Vite encaminha chamadas iniciadas por `/api` para `http://localhost:3000`, o que mantém o fluxo local simples. Quando frontend e API ficam em origens diferentes, o `rack-cors` libera a origem definida em `FRONTEND_ORIGIN`.

## Um projeto Rails menor do que o de costume, mas ainda Rails

O backend foi criado em **modo API**. Isso significa que não usa as camadas de views e assets para renderizar páginas, mas mantém ferramentas centrais do framework.

A classe base dos controllers deixa essa intenção clara:

```ruby
class ApplicationController < ActionController::API
end
```

As rotas também mostram a versão do contrato desde o início:

```ruby
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      get "health", to: "health#show"
      get "books/search", to: "books#search"
    end
  end
end
```

Versionar uma API desde um projeto pequeno pode parecer mais organização do que necessidade imediata. Ainda assim, é um exercício útil: qualquer mudança futura incompatível pode ganhar uma nova versão sem misturar contratos.

O endpoint `search` recebe o termo pesquisado, a página e a quantidade de resultados. Antes de consultar a API externa, o controller verifica:

- se o termo `q` foi informado;
- se `page` é um inteiro positivo;
- se `per_page` é válido e não ultrapassa 50.

Essa validação na borda evita gastar processamento e chamadas externas em uma entrada já conhecida como inválida.

## A integração com a Open Library como serviço

Em vez de concentrar toda a lógica HTTP no controller, a integração foi isolada em `OpenLibrary::SearchService`.

Esse tipo de separação ajuda a distinguir responsabilidades:

- o controller interpreta a requisição e escolhe o status HTTP;
- o serviço conhece o protocolo e o formato da Open Library;
- o frontend consome um formato próprio e estável.

O serviço monta a URL selecionando somente os campos necessários:

```ruby
REQUEST_FIELDS = %w[
  key title author_name first_publish_year cover_i edition_count
].freeze

uri.query = URI.encode_www_form(
  q: @query,
  page: @page,
  limit: @per_page,
  fields: REQUEST_FIELDS.join(",")
)
```

Depois, faz a chamada com `Net::HTTP`. Os limites de abertura e leitura são de 5 e 10 segundos, respectivamente. Esse detalhe é pequeno no código, mas relevante para a experiência: uma dependência externa lenta não deve segurar uma requisição indefinidamente.

O resultado da Open Library também é normalizado. Por exemplo, quando a resposta traz `cover_i`, o serviço constrói a URL de capa:

```ruby
def cover_url_for(cover_id)
  return nil if cover_id.nil?

  "https://covers.openlibrary.org/b/id/#{cover_id}-M.jpg"
end
```

Ao construir um contrato próprio, o frontend não precisa conhecer cada detalhe da resposta original. Se o provedor alterar parte de seu formato, a adaptação pode ficar concentrada no backend.

## Falhas externas também fazem parte do contrato

Uma integração não é completa apenas quando retorna dados. O serviço distingue cenários como:

- resposta JSON inválida;
- timeout;
- falha de rede;
- indisponibilidade ou limite do provedor;
- erro HTTP de origem;
- indisponibilidade geral.

Na sequência, o controller converte essas categorias em respostas que façam sentido para um cliente HTTP. Entradas inválidas retornam `400`, timeout retorna `504` e falhas do serviço externo retornam `502`.

Esse mapeamento deixa a interface apta a mostrar mensagens específicas sem expor detalhes internos. No frontend, `ApiRequestError` preserva o status e o código recebidos da API, enquanto um problema de rede local usa o código `network_error`.

## Cache em duas camadas

O projeto não aplica cache de forma indiscriminada, mas usa duas camadas em momentos distintos:

- `Rails.cache` guarda pesquisas bem-sucedidas por 15 minutos;
- TanStack React Query mantém a resposta no cliente por 30 segundos e conserva dados em cache por até 10 minutos.

A chave de cache do Rails inclui consulta, página e quantidade por página:

```ruby
"open_library:search:v1:q=#{normalized_query}:page=#{@page}:per_page=#{@per_page}"
```

Assim, resultados diferentes não colidem. O cache do Rails fica em memória, em desenvolvimento e em produção. Por ser descartável, a API não precisa de armazenamento persistente para funcionar — uma restrição importante em hospedagens gratuitas com disco efêmero.

É uma divisão útil: o cache do Rails reduz chamadas repetidas à Open Library entre clientes; o cache do React evita trabalho desnecessário durante a navegação no cliente.

## A biblioteca pessoal fica no navegador

Uma decisão importante do projeto atual é não usar Active Record para salvar a biblioteca. Os livros adicionados pelo usuário ficam em `localStorage`:

```typescript
const STORAGE_KEY = "bookradar.library.v1";
```

Ao carregar o conteúdo, o frontend:

- valida se o valor armazenado é um array;
- exige uma chave Open Library para cada livro;
- remove duplicados;
- normaliza autores;
- descarta avaliações fora do intervalo de 1 a 5;
- restaura um status padrão quando encontra um valor desconhecido;
- limpa dados JSON corrompidos.

A biblioteca, portanto, funciona sem pedir ao backend para listar ou atualizar cada item. A escolha reduz o escopo educacional inicial e permite concentrar o Rails no papel de API de catálogo.

Ela também cria um limite claro: os dados pertencem somente ao navegador e ao dispositivo atuais. O projeto não possui login, sincronização ou persistência no servidor. SQLite e as integrações Solid fazem parte da estrutura configurada pelo Rails, mas não representam a persistência dos livros pessoais nesta versão.

## Estado compartilhado e experiência de uso

O frontend organiza a biblioteca em um `LibraryContext`. Esse contexto oferece operações como:

```typescript
addBook
removeBook
toggleFavorite
setStatus
setRating
setNote
```

Cada alteração atualiza o estado React e salva o novo array no navegador. Com essa interface, os componentes não precisam conhecer a chave do `localStorage` ou repetir regras de persistência.

Já a busca usa um fluxo baseado em estados:

- campo sem termo: orientação inicial;
- requisição em andamento: carregamento;
- falha: mensagem de erro;
- resposta vazia: estado sem resultados;
- livros recebidos: lista paginada.

Esses estados são visíveis na interface e também aparecem nos testes. A diferenciação é importante: “não encontrei livros” não deve ser tratado como “não consegui conectar ao servidor”.

## Testar contratos, integrações e interações

O projeto mantém testes nos dois lados.

No backend, os testes de integração garantem que a API:

- padroniza paginação;
- rejeita parâmetros inválidos;
- limita o tamanho da página;
- transforma timeout em `504`;
- transforma indisponibilidade externa em `502`.

Os testes do serviço substituem `Net::HTTP` por respostas controladas para verificar normalização, erros de conexão, timeouts e JSON inválido sem depender de disponibilidade da Open Library durante a execução.

No frontend, Vitest e Testing Library cobrem:

- erros e respostas do cliente HTTP;
- construção dos parâmetros de busca;
- persistência e sanitização da biblioteca;
- estados da tela de pesquisa;
- adição, remoção, favorito, status e filtros.

O objetivo desses testes não é buscar apenas uma porcentagem de cobertura. Eles fixam os contratos e as transições que têm maior impacto para quem usa a aplicação.

## Aprendizados concretos de Rails

Um aspecto marcante da experiência foi lidar com uma sintaxe Ruby bastante específica em comparação com o JavaScript e o TypeScript que já fazem parte do meu dia a dia. Símbolos, blocos, métodos sem parênteses, convenções de nomes e o estilo declarativo das configurações Rails exigem uma leitura diferente do código.

Também ficou mais claro como o framework distribui responsabilidades. Conceitos que parecem abstratos em um tutorial ganham uma posição concreta quando precisam sustentar uma aplicação:

- o router limita os caminhos publicados;
- o controller cuida do ciclo HTTP;
- o service object encapsula a comunicação externa;
- a configuração define o comportamento por ambiente;
- o cache reduz custo e latência;
- os testes protegem o contrato;
- o logger registra falhas sem esconder a resposta ao cliente.

O projeto também evidencia que aprender Rails não significa usar todos os componentes do framework ao mesmo tempo. Active Record, jobs, mailers e Action Cable continuam disponíveis, mas a aplicação utiliza somente o que seu fluxo atual exige.

## Limites e oportunidades de evolução

O estado atual deixa algumas extensões futuras bem definidas:

- persistência da biblioteca no backend;
- autenticação e sincronização entre dispositivos;
- testes end-to-end;
- deploy demonstrativo;
- histórico de leitura e metas;
- ordenação e filtros adicionais.

Essas ideias permanecem como possibilidades. Não são apresentadas como funcionalidades prontas e também não descaracterizam o que o projeto já entrega: uma busca integrada, um fluxo de biblioteca local e uma API Rails testada.

## Conclusão

Construir o BookRadar foi uma forma de estudar Ruby on Rails por dentro de um problema de produto, e não apenas por exemplos isolados. Uma integração com a Open Library, uma rota versionada, um controller que valida e serializa respostas, um serviço com tratamento de falhas e cache e testes de contrato formaram o caminho prático desse aprendizado.

No centro da experiência está a combinação entre familiaridade e estranhamento. React, TypeScript e a organização do frontend já eram terrenos mais conhecidos; Ruby e Rails trouxeram outras convenções de leitura, escrita e estruturação. O resultado é um projeto pequeno o suficiente para ser compreendido por inteiro e completo o suficiente para mostrar como decisões de arquitetura afetam a experiência de uso.
