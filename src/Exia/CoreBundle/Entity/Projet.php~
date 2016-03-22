<?php
namespace Exia\CoreBundle\Entity;
use Doctrine\ORM\Mapping AS ORM;

/**
 * @ORM\Entity
 */
class Projet
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
     * @ORM\Column(type="text", length=255, nullable=true)
     */
    private $Description;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Illustration;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Lien;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Telechargement ;

    /**
     * @ORM\ManyToOne(targetEntity="Exia\CoreBundle\Entity\Profil", inversedBy="projet")
     * @ORM\JoinColumn(name="profil_id", referencedColumnName="ID", nullable=false)
     */
    private $profil;
}