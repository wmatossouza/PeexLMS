# Conteúdo de apoio do seed (vídeos de exemplo e textos de estudo). Carregado por seed.ps1.

# Vídeos públicos de exemplo (licença livre) — rotacionam entre as aulas em vídeo
$Videos = @(
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4'
)

function TextoGenerico($Curso, $Titulo, $Descricao, $EhVideo) {
    $abertura = if ($EhVideo) { 'Assista ao vídeo acima e use estas anotações para acompanhar.' } else { 'Leia com calma e anote suas dúvidas.' }
    "## Objetivo da aula`n$abertura Nesta aula você vai entender **$Titulo** dentro do curso $Curso. $Descricao`n`n## Pontos principais`n- Entenda o conceito e para que ele serve`n- Veja exemplos de uso no dia a dia`n- Identifique erros comuns e como evitá-los`n`n## Para fixar`nDepois de estudar, explique o tema com suas palavras e aplique em um pequeno exercício. Quando terminar, marque a aula como concluída para acompanhar seu progresso."
}

$DemoT1 = @'
## Bem-vindo ao curso de demonstração
Este curso existe para você **ver a plataforma completa**: aulas em vídeo, aulas em texto, navegação entre aulas, progresso e quiz final.

## Como o curso funciona
- As aulas são feitas em ordem, mas você pode abrir qualquer uma pela lista ao lado
- Ao terminar, clique em **Concluir e continuar** para registrar o progresso
- No final há um quiz para fixar o conteúdo
'@

$DemoT2 = @'
## Conceitos fundamentais
Aprender bem exige três coisas: **contexto**, **prática** e **revisão**. Esta aula resume cada uma delas.

## Contexto
Antes de executar, entenda o problema que está resolvendo. Perguntas úteis:
- Quem vai usar o resultado?
- Qual é o critério de sucesso?
- O que acontece se eu não fizer?

## Prática
Pratique em pequenos ciclos. Um exemplo de ciclo em pseudocódigo:

```
para cada tópico do curso:
    estudar(tópico)
    praticar(tópico)
    revisar(tópico)
```

## Revisão
Volte ao conteúdo depois de alguns dias. A revisão espaçada fixa o aprendizado por mais tempo do que estudar tudo de uma vez.
'@

$DemoT3 = @'
## Demonstração prática
O vídeo acima é uma demonstração curta. Enquanto assiste, observe o ritmo, os pontos de atenção e como cada etapa se conecta à próxima.

## O que observar
- A sequência de etapas
- Onde costumam acontecer os erros
- Como validar o resultado ao final

## Exercício
Pause o vídeo e descreva, com suas palavras, o que acabou de ver. Se conseguir explicar, você entendeu.
'@

$DemoT4 = @'
## Boas práticas e checklist
Use esta lista antes de dar uma tarefa por concluída:
- O objetivo foi atingido e eu consigo demonstrar isso
- Revisei o resultado com olhar crítico
- Documentei o que mudou e por quê
- Pedi feedback a alguém do time

## Erros comuns
- Pular a etapa de revisão por pressa
- Aprender só assistindo, sem praticar
- Não registrar dúvidas para depois

## Exemplo de registro de estudo
```
Tema: Conceitos fundamentais
Aprendi: contexto, prática e revisão
Dúvida: como medir se aprendi?
Próximo passo: refazer o exercício amanhã
```
'@

$DemoT5 = @'
## Aula completa
Este é um vídeo mais longo, para você testar o player com pausa, avanço e tela cheia. Use as anotações abaixo para acompanhar.

## Roteiro sugerido
- Primeiros minutos: apresentação do tema
- Meio: desenvolvimento e exemplos
- Final: fechamento e conclusões

Dica: pause sempre que quiser anotar algo importante.
'@

$DemoT6 = @'
## Resumo e próximos passos
Você passou por vídeos, textos e exercícios. Para consolidar:
- **Contexto** vem antes da execução
- **Prática** em ciclos curtos fixa o aprendizado
- **Revisão** espaçada evita o esquecimento

## E agora?
Conclua esta aula e responda ao **quiz final** na página do curso. Depois, explore as trilhas para continuar sua jornada.
'@
