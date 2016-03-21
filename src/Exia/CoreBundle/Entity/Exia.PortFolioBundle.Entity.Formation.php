<?php
namespace Exia\CoreBundle\Entity;
use Doctrine\ORM\Mapping AS ORM;

/**
 * @ORM\Entity
 */
class Formation
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $ID;

    /**
     * @ORM\Column(type="integer", length=4, nullable=true)
     */
    private $Annee;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Titre;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Diplome;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Lieu;

    /**
     * @ORM\Column(type="text", nullable=true)
     */
    private $Descriptif;

    /**
     * @ORM\ManyToOne(targetEntity="Exia\CoreBundle\Entity\Profil", inversedBy="formation")
     * @ORM\JoinColumn(name="profil_id", referencedColumnName="ID", nullable=false)
     */
    private $profil;
}