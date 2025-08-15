<?php

namespace App\Controller;

use App\Entity\Questionnaire;
use App\Entity\Question;
use App\Entity\Reponse;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api')]
class ApiQuestionController extends AbstractController
{

    #[Route('/quizzes/{id}/questions', name: 'api_quiz_add_question', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function addQuestion(
        Request $request,
        int $id,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Récupérer le questionnaire par son ID
        $questionnaire = $entityManager->getRepository(Questionnaire::class)->find($id);

        if (!$questionnaire) {
            return new JsonResponse(['error' => 'Questionnaire non trouvé'], Response::HTTP_NOT_FOUND);
        }

        // Vérifier que l'utilisateur est propriétaire du questionnaire
        if ($questionnaire->getCreePar() !== $this->getUser()) {
            return new JsonResponse(['error' => 'Accès non autorisé - vous n\'êtes pas le propriétaire de ce questionnaire'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        // Validation des données
        if (!isset($data['text']) || empty($data['text'])) {
            return new JsonResponse(['error' => 'Le texte de la question est obligatoire'], Response::HTTP_BAD_REQUEST);
        }

        if (!isset($data['answers']) || !is_array($data['answers']) || count($data['answers']) < 2) {
            return new JsonResponse(['error' => 'Il faut au moins 2 réponses'], Response::HTTP_BAD_REQUEST);
        }

        $hasCorrectAnswer = false;
        foreach ($data['answers'] as $answerData) {
            if (!isset($answerData['text']) || empty($answerData['text'])) {
                return new JsonResponse(['error' => 'Toutes les réponses doivent avoir un texte'], Response::HTTP_BAD_REQUEST);
            }
            if (isset($answerData['correct']) && $answerData['correct']) {
                $hasCorrectAnswer = true;
            }
        }

        if (!$hasCorrectAnswer) {
            return new JsonResponse(['error' => 'Il faut au moins une réponse correcte'], Response::HTTP_BAD_REQUEST);
        }

        try {
            // Créer la question
            $question = new Question();
            $question->setTexte($data['text']);
            $question->setQuestionnaire($questionnaire);
            $question->setNumeroOrdre(count($questionnaire->getQuestions()) + 1);

            $entityManager->persist($question);

            // Créer les réponses
            foreach ($data['answers'] as $index => $answerData) {
                $reponse = new Reponse();
                $reponse->setTexte($answerData['text']);
                $reponse->setEstCorrecte($answerData['correct'] ?? false);
                $reponse->setQuestion($question);
                $reponse->setNumeroOrdre($index + 1);

                $entityManager->persist($reponse);
            }

            $entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Question ajoutée avec succès',
                'question' => [
                    'id' => $question->getId(),
                    'text' => $question->getTexte(),
                    'orderNumber' => $question->getNumeroOrdre(),
                    'answers' => $question->getReponses()->map(function ($reponse) {
                        return [
                            'id' => $reponse->getId(),
                            'text' => $reponse->getTexte(),
                            'correct' => $reponse->isCorrect(),
                            'orderNumber' => $reponse->getNumeroOrdre()
                        ];
                    })->toArray()
                ]
            ], Response::HTTP_CREATED);

        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Erreur lors de l\'ajout de la question: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/questions/{id}', name: 'api_question_update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function updateQuestion(
        Request $request,
        int $id,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Récupérer la question par son ID
        $question = $entityManager->getRepository(Question::class)->find($id);

        if (!$question) {
            return new JsonResponse(['error' => 'Question non trouvée'], Response::HTTP_NOT_FOUND);
        }

        // Vérifier que l'utilisateur est propriétaire du questionnaire
        if ($question->getQuestionnaire()->getCreePar() !== $this->getUser()) {
            return new JsonResponse(['error' => 'Accès non autorisé - vous n\'êtes pas le propriétaire de ce questionnaire'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);



        // Validation des données
        if (!isset($data['texte']) || empty($data['texte'])) {
            return new JsonResponse(['error' => 'Le texte de la question est obligatoire'], Response::HTTP_BAD_REQUEST);
        }

        // Nettoyer le texte (enlever les espaces en début et fin)
        $data['texte'] = trim($data['texte']);

        // Validation des contraintes de la question
        if (strlen($data['texte']) < 5) {
            return new JsonResponse(['error' => 'La question doit contenir au moins 5 caractères'], Response::HTTP_BAD_REQUEST);
        }

        if (strlen($data['texte']) > 2000) {
            return new JsonResponse(['error' => 'La question ne peut pas dépasser 2000 caractères'], Response::HTTP_BAD_REQUEST);
        }

        if (!str_ends_with($data['texte'], '?')) {
            return new JsonResponse(['error' => 'Une question doit se terminer par un point d\'interrogation'], Response::HTTP_BAD_REQUEST);
        }

        if (!isset($data['reponses']) || !is_array($data['reponses']) || count($data['reponses']) < 2) {
            return new JsonResponse(['error' => 'Il faut au moins 2 réponses'], Response::HTTP_BAD_REQUEST);
        }

        $hasCorrectAnswer = false;
        foreach ($data['reponses'] as $index => $reponseData) {
            // Nettoyer le texte de la réponse
            $data['reponses'][$index]['texte'] = trim($reponseData['texte']);

            if (!isset($reponseData['texte']) || empty(trim($reponseData['texte']))) {
                return new JsonResponse(['error' => 'Toutes les réponses doivent avoir un texte'], Response::HTTP_BAD_REQUEST);
            }
            if (strlen(trim($reponseData['texte'])) > 1000) {
                return new JsonResponse(['error' => 'Une réponse ne peut pas dépasser 1000 caractères'], Response::HTTP_BAD_REQUEST);
            }
            if (isset($reponseData['estCorrecte']) && $reponseData['estCorrecte']) {
                $hasCorrectAnswer = true;
            }
        }

        if (!$hasCorrectAnswer) {
            return new JsonResponse(['error' => 'Il faut au moins une réponse correcte'], Response::HTTP_BAD_REQUEST);
        }

        try {
            // Mettre à jour le texte de la question
            $question->setTexte($data['texte']);

            // Mettre à jour le numéro d'ordre si fourni
            if (isset($data['numeroOrdre'])) {
                $question->setNumeroOrdre($data['numeroOrdre']);
            }

            // Supprimer d'abord toutes les réponses utilisateur liées aux réponses de cette question
            foreach ($question->getReponses() as $reponse) {
                // Supprimer toutes les réponses utilisateur qui référencent cette réponse
                foreach ($reponse->getReponsesUtilisateur() as $reponseUtilisateur) {
                    $entityManager->remove($reponseUtilisateur);
                }
            }

            // Forcer la suppression des réponses utilisateur d'abord
            $entityManager->flush();

            // Maintenant supprimer les réponses
            foreach ($question->getReponses() as $reponse) {
                $entityManager->remove($reponse);
            }

            // Forcer la suppression des réponses avant d'ajouter les nouvelles
            $entityManager->flush();

            // Créer les nouvelles réponses
            foreach ($data['reponses'] as $index => $reponseData) {
                $reponse = new Reponse();
                $reponse->setTexte($reponseData['texte']);
                $reponse->setEstCorrecte($reponseData['estCorrecte'] ?? false);
                $reponse->setQuestion($question);
                $reponse->setNumeroOrdre($reponseData['numeroOrdre'] ?? $index + 1);

                $entityManager->persist($reponse);
            }

            $entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Question mise à jour avec succès',
                'question' => [
                    'id' => $question->getId(),
                    'texte' => $question->getTexte(),
                    'numeroOrdre' => $question->getNumeroOrdre(),
                    'reponses' => $question->getReponses()->map(function ($reponse) {
                        return [
                            'id' => $reponse->getId(),
                            'texte' => $reponse->getTexte(),
                            'correct' => $reponse->isCorrect(),
                            'numeroOrdre' => $reponse->getNumeroOrdre()
                        ];
                    })->toArray()
                ]
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Erreur lors de la mise à jour de la question: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}