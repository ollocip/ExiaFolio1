<?php

namespace Exia\CoreBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;



class CoreController extends Controller
{
    public function indexAction()
    {
         if ($this->get('security.context')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            return $this->render('ExiaCoreBundle:Core:index.html.twig');
        }

        $authenticationUtils = $this->get('security.authentication_utils');

        return $this->render('ExiaCoreBundle:Core:connexion.html.twig', array(
          'last_username' => $authenticationUtils->getLastUsername(),
          'error'         => $authenticationUtils->getLastAuthenticationError(),
        ));
    }
    

}