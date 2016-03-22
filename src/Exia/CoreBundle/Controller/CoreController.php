<?php

namespace Exia\CoreBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Exia\CoreBundle\Entity\Formation;
use Exia\CoreBundle\Form\FormationType;
use Exia\CoreBundle\Entity\Profil;
use Exia\CoreBundle\Form\ProfilType;
use Exia\CoreBundle\Entity\Competence;
use Exia\CoreBundle\Form\CompetenceType;
use Exia\CoreBundle\Entity\CategorieCompetences;
use Exia\CoreBundle\Form\CategorieCompetencesType;
use Exia\CoreBundle\Entity\Projet;
use Exia\CoreBundle\Form\ProjetType;
use Exia\CoreBundle\Entity\Experiences;
use Exia\CoreBundle\Form\ExperienceType;

class CoreController extends Controller
{
    public function indexAction(Request $request)
    {
         if ($this->get('security.context')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

            $em = $this->getDoctrine()->getManager();

            if($this->getUser()->getProfil())
            {
            return $this->render('ExiaCoreBundle:Core:index.html.twig');
        }
        else {
            $profil = new Profil();
            $profil->setUser($this->getUser());
            $form = $this->createForm(new ProfilType(), $profil);
            $form->handleRequest($request);
            if ($form->isValid()) 
        {   
            $em->persist($profil);
            $em->flush();

            $request->getSession()->getFlashBag()->add('notice', 'Profil enregistrée.');

            return $this->redirect($this->generateUrl('exia_core_profil'));
        }
            return $this->render('ExiaCoreBundle:Core:ajout-profil.html.twig', array('form' => $form->createView()) );
        }
        }

        $authenticationUtils = $this->get('security.authentication_utils');

        return $this->render('ExiaCoreBundle:Core:connexion.html.twig', array(
          'last_username' => $authenticationUtils->getLastUsername(),
          'error'         => $authenticationUtils->getLastAuthenticationError(),
        ));
    }








     public function formationsAction()
    {
        $em = $this->getDoctrine()->getManager();
        $id= $this->getUser()->getProfil();
        $formations = $em->getRepository('ExiaCoreBundle:Formation')->findByProfil($id);
        return $this->render('ExiaCoreBundle:Core:liste-formation.html.twig', array('formations' => $formations));
    }
     public function AjoutFormationAction(Request $request)
    {
        $formation = new formation();
        
        $em = $this->getDoctrine()->getManager();
        $formation->setProfil($this->getUser()->getProfil());
        $form = $this->createForm(new FormationType(), $formation);
        $form->handleRequest($request);
        
        if ($form->isValid()) 
        {   
            $em->persist($formation);
            $em->flush();

            $request->getSession()->getFlashBag()->add('notice', 'Formation enregistrée.');

            return $this->redirect($this->generateUrl('exia_core_formations'));
        }
        
        return $this->render('ExiaCoreBundle:Core:ajout-formation.html.twig', array('form' => $form->createView()) );
    }
    public function editerFormationAction(Request $request, formation $id)
    {
        $em = $this->getDoctrine()->getManager();    
        $form = $this->createForm(new FormationType(), $id);
        $form->handleRequest($request);

        if ($form->isValid()) 
        {    
            
            
            $em->persist($id);
            $em->flush();

            $request->getSession()->getFlashBag()->add('notice', 'Professeur modifié.');

            return $this->redirect($this->generateUrl('exia_core_formations', array('id' => $id->getId() )));
        }
        
        return $this->render('ExiaCoreBundle:Core:editer-formation.html.twig', array('form' => $form->createView(), 'professeur' => $id));
    }
       public function supprimerFormationAction(Request $request, formation $id)
    {
        $em = $this->getDoctrine()->getManager(); 
        $em->remove($id);      
        $em->flush();

        return $this->redirect($this->generateUrl('exia_core_formations'));
    }
    








       public function ProfilAction(Request $request)
    {

        $em = $this->getDoctrine()->getManager();
        $user_id = $this->getUser()->getId();
        $profil = $em->getRepository('ExiaCoreBundle:Profil')->findOneByUser($user_id);
        if ($profil!= null){
            return $this->render('ExiaCoreBundle:Core:profil.html.twig', array('profil' => $profil));
        }
        else {
            $profil = new Profil();
            $profil->setUser($this->getUser());
            $form = $this->createForm(new ProfilType(), $profil);
            $form->handleRequest($request);
            if ($form->isValid()) 
        {   
            $em->persist($profil);
            $em->flush();

            $request->getSession()->getFlashBag()->add('notice', 'Profil enregistrée.');

            return $this->redirect($this->generateUrl('exia_core_profil'));
        }
            return $this->render('ExiaCoreBundle:Core:ajout-profil.html.twig', array('form' => $form->createView()) );
        }
    }
     public function AjoutProfilAction(Request $request)
    {
        $profil = new Profil();
        
        $em = $this->getDoctrine()->getManager();
        $profil->setUser($this->getUser());
        $form = $this->createForm(new ProfilType(), $profil);
        $form->handleRequest($request);
        
        if ($form->isValid()) 
        {   
            $em->persist($profil);
            $em->flush();

            $request->getSession()->getFlashBag()->add('notice', 'Profil enregistrée.');

            return $this->redirect($this->generateUrl('exia_core_profil'));
        }
        
        return $this->render('ExiaCoreBundle:Core:ajout-profil.html.twig', array('form' => $form->createView()) );
    }
    public function editerProfilAction(Request $request, profil $id)
    {
        $em = $this->getDoctrine()->getManager();    
        $form = $this->createForm(new ProfilType(), $id);
        $form->handleRequest($request);

        if ($form->isValid()) 
        {    
            
            
            $em->persist($id);
            $em->flush();

            $request->getSession()->getFlashBag()->add('notice', 'Profil modifié.');

            return $this->redirect($this->generateUrl('exia_core_profil', array('id' => $id->getId() )));
        }
        
        return $this->render('ExiaCoreBundle:Core:editer-profil.html.twig', array('form' => $form->createView(), 'professeur' => $id));
    }













    public function competencesAction()
    {
        $em = $this->getDoctrine()->getManager();
        $id= $this->getUser()->getProfil();
        $competences = $em->getRepository('ExiaCoreBundle:Competence')->findByProfil($id);
        return $this->render('ExiaCoreBundle:Core:liste-competence.html.twig', array('competences' => $competences));
    }
     public function AjoutCompetenceAction(Request $request)
    {
        $competences = new competence();
        
        $em = $this->getDoctrine()->getManager();
        $competences->setProfil($this->getUser()->getProfil());
        $form = $this->createForm(new CompetenceType(), $competences);
        $form->handleRequest($request);
        
        if ($form->isValid()) 
        {   
            $em->persist($competences);
            $em->flush();

            $request->getSession()->getFlashBag()->add('notice', 'Competence enregistrée.');

            return $this->redirect($this->generateUrl('exia_core_competences'));
        }
        
        return $this->render('ExiaCoreBundle:Core:ajout-competence.html.twig', array('form' => $form->createView()) );
    }
    public function editerCompetenceAction(Request $request, competence $id)
    {
        $em = $this->getDoctrine()->getManager();    
        $form = $this->createForm(new CompetenceType(), $id);
        $form->handleRequest($request);

        if ($form->isValid()) 
        {    
            
            
            $em->persist($id);
            $em->flush();

            $request->getSession()->getFlashBag()->add('notice', 'Competence modifié.');

            return $this->redirect($this->generateUrl('exia_core_competences', array('id' => $id->getId() )));
        }
        
        return $this->render('ExiaCoreBundle:Core:editer-competence.html.twig', array('form' => $form->createView(), 'professeur' => $id));
    }
       public function supprimerCompetenceAction(Request $request, competence $id)
    {
        $em = $this->getDoctrine()->getManager(); 
        $em->remove($id);      
        $em->flush();

        return $this->redirect($this->generateUrl('exia_core_competences'));
    }







    public function AjoutCategorieCompetencesAction(Request $request)
    {
        $categoriecompetences = new categoriecompetences();
        
        $em = $this->getDoctrine()->getManager();
        $form = $this->createForm(new CategorieCompetencesType(), $categoriecompetences);
        $form->handleRequest($request);
        
        if ($form->isValid()) 
        {   
            $em->persist($categoriecompetences);
            $em->flush();

            $request->getSession()->getFlashBag()->add('notice', 'Competence enregistrée.');

            return $this->redirect($this->generateUrl('exia_core_ajout_competence'));
        }
        
        return $this->render('ExiaCoreBundle:Core:ajout-categoriecompetences.html.twig', array('form' => $form->createView()) );
    }














    public function ProjetAction()
    {
        $em = $this->getDoctrine()->getManager();
        $id= $this->getUser()->getProfil();
        $projets = $em->getRepository('ExiaCoreBundle:Projet')->findByProfil($id);
        return $this->render('ExiaCoreBundle:Core:liste-projet.html.twig', array('projets' => $projets));
    }
     public function AjoutProjetAction(Request $request)
    {
        $projet = new projet();
        
        $em = $this->getDoctrine()->getManager();
        $projet->setProfil($this->getUser()->getProfil());
        $form = $this->createForm(new ProjetType(), $projet);
        $form->handleRequest($request);
        
        if ($form->isValid()) 
        {   
            $em->persist($projet);
            $em->flush();

            $request->getSession()->getFlashBag()->add('notice', 'Projet enregistrée.');

            return $this->redirect($this->generateUrl('exia_core_projet'));
        }
        
        return $this->render('ExiaCoreBundle:Core:ajout-projet.html.twig', array('form' => $form->createView()) );
    }
    public function editerProjetAction(Request $request, projet $id)
    {
        $em = $this->getDoctrine()->getManager();    
        $form = $this->createForm(new ProjetType(), $id);
        $form->handleRequest($request);

        if ($form->isValid()) 
        {    
            
            
            $em->persist($id);
            $em->flush();

            $request->getSession()->getFlashBag()->add('notice', 'Projet modifié.');

            return $this->redirect($this->generateUrl('exia_core_projet', array('id' => $id->getId() )));
        }
        
        return $this->render('ExiaCoreBundle:Core:editer-projet.html.twig', array('form' => $form->createView(), 'professeur' => $id));
    }
       public function supprimerProjetAction(Request $request, projet $id)
    {
        $em = $this->getDoctrine()->getManager(); 
        $em->remove($id);      
        $em->flush();

        return $this->redirect($this->generateUrl('exia_core_projet'));
    }













    public function ExperienceAction()
    {
        $em = $this->getDoctrine()->getManager();
        $id= $this->getUser()->getProfil();
        $experiences = $em->getRepository('ExiaCoreBundle:Experiences')->findByProfil($id);
        return $this->render('ExiaCoreBundle:Core:liste-experience.html.twig', array('experiences' => $experiences));
    }
     public function AjoutExperienceAction(Request $request)
    {
        $experience = new experiences();
        
        $em = $this->getDoctrine()->getManager();
        $experience->setProfil($this->getUser()->getProfil());
        $form = $this->createForm(new ExperienceType(), $experience);
        $form->handleRequest($request);
        
        if ($form->isValid()) 
        {   
            $em->persist($experience);
            $em->flush();

            $request->getSession()->getFlashBag()->add('notice', 'Experience enregistrée.');

            return $this->redirect($this->generateUrl('exia_core_experience'));
        }
        
        return $this->render('ExiaCoreBundle:Core:ajout-experience.html.twig', array('form' => $form->createView()) );
    }
    public function editerExperienceAction(Request $request, experiences $id)
    {
        $em = $this->getDoctrine()->getManager();    
        $form = $this->createForm(new ExperienceType(), $id);
        $form->handleRequest($request);

        if ($form->isValid()) 
        {    
            
            
            $em->persist($id);
            $em->flush();

            $request->getSession()->getFlashBag()->add('notice', 'Experience modifié.');

            return $this->redirect($this->generateUrl('exia_core_experience', array('id' => $id->getId() )));
        }
        
        return $this->render('ExiaCoreBundle:Core:editer-experience.html.twig', array('form' => $form->createView(), 'professeur' => $id));
    }
       public function supprimerExperienceAction(Request $request, experiences $id)
    {
        $em = $this->getDoctrine()->getManager(); 
        $em->remove($id);      
        $em->flush();

        return $this->redirect($this->generateUrl('exia_core_experience'));
    }
    

}