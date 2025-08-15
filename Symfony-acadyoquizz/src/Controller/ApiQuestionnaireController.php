<?php

namespace App\Controller;

use App\Entity\Questionnaire;
use App\Entity\TentativeQuestionnaire;
use App\Entity\ReponseUtilisateur;
use App\Entity\Question;
use App\Entity\Reponse;
use App\Entity\Utilisateur;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/public/questionnaires')]
class ApiQuestionnaireController extends AbstractController
{
    /**
     * Récupère un questionnaire public par ID
     */
    #[Route('/{id}', name: 'api_questionnaire_public_get', methods: ['GET'])]
    public function getQuestionnaire(int $id, EntityManagerInterface $entityManager): JsonResponse
    {
        $questionnaire = $entityManager->getRepository(Questionnaire::class)->find($id);

        if (!$questionnaire) {
            return new JsonResponse(['error' => 'Questionnaire non trouvé'], Response::HTTP_NOT_FOUND);
        }

        if (!$questionnaire->isActive()) {
            return new JsonResponse(['error' => 'Ce questionnaire n\'est pas actif'], Response::HTTP_FORBIDDEN);
        }

        // Récupérer les questions avec leurs réponses
        $questions = $entityManager->getRepository(Question::class)
            ->createQueryBuilder('q')
            ->leftJoin('q.reponses', 'r')
            ->addSelect('r')
            ->where('q.questionnaire = :questionnaireId')
            ->setParameter('questionnaireId', $id)
            ->orderBy('q.numeroOrdre', 'ASC')
            ->addOrderBy('r.numeroOrdre', 'ASC')
            ->getQuery()
            ->getResult();

        $questionsData = [];
        foreach ($questions as $question) {
            $reponsesData = [];
            foreach ($question->getReponses() as $reponse) {
                $reponsesData[] = [
                    'id' => $reponse->getId(),
                    'texte' => $reponse->getTexte(),
                    'numeroOrdre' => $reponse->getNumeroOrdre(),
                    'correct' => $reponse->isCorrect()
                ];
            }

            $questionsData[] = [
                'id' => $question->getId(),
                'texte' => $question->getTexte(),
                'numeroOrdre' => $question->getNumeroOrdre(),
                'reponses' => $reponsesData
            ];
        }

        return new JsonResponse([
            'id' => $questionnaire->getId(),
            'titre' => $questionnaire->getTitre(),
            'description' => $questionnaire->getDescription(),
            'codeAcces' => $questionnaire->getCodeAcces(),
            'estActif' => $questionnaire->isActive(),
            'estDemarre' => $questionnaire->isStarted(),
            'scorePassage' => $questionnaire->getScorePassage(),
            'questions' => $questionsData
        ]);
    }

    /**
     * Récupère un questionnaire par code d'accès
     */
    #[Route('/code/{code}', name: 'api_questionnaire_by_code', methods: ['GET'])]
    public function getQuestionnaireByCode(string $code, EntityManagerInterface $entityManager): JsonResponse
    {
        $questionnaire = $entityManager->getRepository(Questionnaire::class)->findOneBy(['codeAcces' => $code]);

        if (!$questionnaire) {
            return new JsonResponse(['error' => 'Questionnaire non trouvé'], Response::HTTP_NOT_FOUND);
        }

        if (!$questionnaire->isActive()) {
            return new JsonResponse(['error' => 'Ce questionnaire n\'est pas actif'], Response::HTTP_FORBIDDEN);
        }

        // Récupérer les questions avec leurs réponses
        $questions = $entityManager->getRepository(Question::class)
            ->createQueryBuilder('q')
            ->leftJoin('q.reponses', 'r')
            ->addSelect('r')
            ->where('q.questionnaire = :questionnaireId')
            ->setParameter('questionnaireId', $questionnaire->getId())
            ->orderBy('q.numeroOrdre', 'ASC')
            ->addOrderBy('r.numeroOrdre', 'ASC')
            ->getQuery()
            ->getResult();

        $questionsData = [];
        foreach ($questions as $question) {
            $reponsesData = [];
            foreach ($question->getReponses() as $reponse) {
                $reponsesData[] = [
                    'id' => $reponse->getId(),
                    'texte' => $reponse->getTexte(),
                    'numeroOrdre' => $reponse->getNumeroOrdre(),
                    'correct' => $reponse->isCorrect()
                ];
            }

            $questionsData[] = [
                'id' => $question->getId(),
                'texte' => $question->getTexte(),
                'numeroOrdre' => $question->getNumeroOrdre(),
                'reponses' => $reponsesData
            ];
        }

        return new JsonResponse([
            'id' => $questionnaire->getId(),
            'titre' => $questionnaire->getTitre(),
            'description' => $questionnaire->getDescription(),
            'codeAcces' => $questionnaire->getCodeAcces(),
            'estActif' => $questionnaire->isActive(),
            'estDemarre' => $questionnaire->isStarted(),
            'scorePassage' => $questionnaire->getScorePassage(),
            'questions' => $questionsData
        ]);
    }

    /**
     * Soumet les réponses d'un questionnaire
     */
    #[Route('/{id}/submit', name: 'api_questionnaire_submit', methods: ['POST'])]
    public function submitQuestionnaire(
        Request $request,
        int $id,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $questionnaire = $entityManager->getRepository(Questionnaire::class)->find($id);

        if (!$questionnaire) {
            return new JsonResponse(['error' => 'Questionnaire non trouvé'], Response::HTTP_NOT_FOUND);
        }

        if (!$questionnaire->isActive()) {
            return new JsonResponse(['error' => 'Ce questionnaire n\'est pas actif'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data || !isset($data['participantFirstName']) || !isset($data['participantLastName']) || !isset($data['answers'])) {
            return new JsonResponse(['error' => 'Données manquantes'], Response::HTTP_BAD_REQUEST);
        }

        // Récupérer l'utilisateur connecté ou null pour les utilisateurs anonymes
        $utilisateur = null;
        if ($this->getUser()) {
            $utilisateur = $this->getUser();
        }

        try {
            // Créer la tentative
            $tentative = new TentativeQuestionnaire();
            $tentative->setPrenomParticipant($data['participantFirstName']);
            $tentative->setNomParticipant($data['participantLastName']);
            $tentative->setQuestionnaire($questionnaire);
            $tentative->setUtilisateur($utilisateur);
            $tentative->setDateDebut(new \DateTimeImmutable());
            $tentative->setDateFin(new \DateTimeImmutable());

            $entityManager->persist($tentative);

            // Traiter les réponses
            $score = 0;
            $totalQuestions = 0;
            $reponseDetails = [];
            $questionsTraitees = [];

            foreach ($data['answers'] as $answerData) {
                $questionId = $answerData['questionId'] ?? null;
                $reponseId = $answerData['answerId'] ?? null;

                if (!$questionId || !$reponseId) {
                    continue;
                }

                $question = $entityManager->getRepository(Question::class)->find($questionId);
                $reponse = $entityManager->getRepository(Reponse::class)->find($reponseId);

                if (!$question || !$reponse || $question->getQuestionnaire()->getId() !== $id) {
                    continue;
                }

                // Créer la réponse utilisateur
                $reponseUtilisateur = new ReponseUtilisateur();
                $reponseUtilisateur->setTentativeQuestionnaire($tentative);
                $reponseUtilisateur->setQuestion($question);
                $reponseUtilisateur->setReponse($reponse);
                $reponseUtilisateur->setDateReponse(new \DateTimeImmutable());

                $entityManager->persist($reponseUtilisateur);
            }

            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Quiz soumis avec succès',
                'tentativeId' => $tentative->getId()
            ]);

        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Erreur lors de la soumission'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}