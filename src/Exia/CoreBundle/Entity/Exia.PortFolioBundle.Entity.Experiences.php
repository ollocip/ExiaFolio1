<?php
namespace Exia\CoreBundle\Entity;
use Doctrine\ORM\Mapping AS ORM;

/**
 * @ORM\Entity
 */
class Experiences
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
    private $Poste;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Entreprise;

    /**
     * @ORM\Column(type="text", nullable=true)
     */
    private $Detail;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Lieu;

    /**
     * @ORM\ManyToOne(targetEntity="Exia\CoreBundle\Entity\Profil", inversedBy="experiences")
     * @ORM\JoinColumn(name="profil_id", referencedColumnName="ID", nullable=false)
     */
    private $profil;
}