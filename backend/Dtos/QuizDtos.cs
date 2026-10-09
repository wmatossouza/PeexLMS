using System.ComponentModel.DataAnnotations;

namespace Peex.Api.Dtos;

public record QuizOpcaoRequest(
    [Required, MinLength(1)] string Texto,
    bool Correta
);

public record QuizPerguntaRequest(
    [Required, MinLength(3)] string Enunciado,
    int Ordem,
    [MinLength(2)] List<QuizOpcaoRequest> Opcoes
);

public record QuizRequest(
    [Required, MinLength(3)] string Titulo,
    [MinLength(1)] List<QuizPerguntaRequest> Perguntas
);

// Visão de administração: inclui qual opção é a correta.
public record QuizOpcaoResponse(int Id, string Texto, bool Correta);
public record QuizPerguntaResponse(int Id, string Enunciado, int Ordem, List<QuizOpcaoResponse> Opcoes);
public record QuizResponse(int Id, int CursoId, string Titulo, List<QuizPerguntaResponse> Perguntas);

// Visão do aluno: nunca revela qual opção é a correta antes de responder.
public record QuizOpcaoParaResponderResponse(int Id, string Texto);
public record QuizPerguntaParaResponderResponse(int Id, string Enunciado, int Ordem, List<QuizOpcaoParaResponderResponse> Opcoes);
public record QuizParaResponderResponse(int Id, int CursoId, string Titulo, List<QuizPerguntaParaResponderResponse> Perguntas, ResultadoQuizResponse? UltimoResultado);

public record RespostaSubmissao(int QuizPerguntaId, int QuizOpcaoId);
public record ResponderQuizRequest(List<RespostaSubmissao> Respostas);
public record ResultadoQuizResponse(int QuizId, int Acertos, int Total, DateTime RespondidoEm);
