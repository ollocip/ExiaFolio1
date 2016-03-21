<?php
namespace Exia\CoreBundle\Entity;
use Doctrine\ORM\Mapping AS ORM;

/**
 * @ORM\Entity
 */
class Profil
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $ID;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Nom;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Prenom;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Adresse;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Mail;

    /**
     * @ORM\Column(type="integer", length=10, nullable=true)
     */
    private $Tel;

    /**
     * @ORM\Column(type="text", nullable=true)
     */
    private $Message;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Illustration;

    /**
     * @ORM\Column(type="string", length=5, nullable=true)
     */
    private $Theme ;

    /**
     * @ORM\OneToMany(targetEntity="Exia\CoreBundle\Entity\Formation", mappedBy="profil")
     */
    private $formation;

    /**
     * @ORM\OneToMany(targetEntity="Exia\CoreBundle\Entity\Projet", mappedBy="profil")
     */
    private $projet;

    /**
     * @ORM\OneToMany(targetEntity="Exia\CoreBundle\Entity\Experiences", mappedBy="profil")
     */
    private $experiences;

    /**
     * @ORM\OneToMany(targetEntity="Exia\CoreBundle\Entity\Competence", mappedBy="profil")
     */
    private $competence;
}