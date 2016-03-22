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
     * @ORM\JoinColumn(name="profil_id", referencedColumnName="id", nullable=false)
     */
    private $profil;

    /**
     * Get ID
     *
     * @return integer 
     */
    public function getID()
    {
        return $this->ID;
    }

    /**
     * Set Nom
     *
     * @param string $nom
     * @return Projet
     */
    public function setNom($nom)
    {
        $this->Nom = $nom;

        return $this;
    }

    /**
     * Get Nom
     *
     * @return string 
     */
    public function getNom()
    {
        return $this->Nom;
    }

    /**
     * Set Description
     *
     * @param string $description
     * @return Projet
     */
    public function setDescription($description)
    {
        $this->Description = $description;

        return $this;
    }

    /**
     * Get Description
     *
     * @return string 
     */
    public function getDescription()
    {
        return $this->Description;
    }

    /**
     * Set Illustration
     *
     * @param string $illustration
     * @return Projet
     */
    public function setIllustration($illustration)
    {
        $this->Illustration = $illustration;

        return $this;
    }

    /**
     * Get Illustration
     *
     * @return string 
     */
    public function getIllustration()
    {
        return $this->Illustration;
    }

    /**
     * Set Lien
     *
     * @param string $lien
     * @return Projet
     */
    public function setLien($lien)
    {
        $this->Lien = $lien;

        return $this;
    }

    /**
     * Get Lien
     *
     * @return string 
     */
    public function getLien()
    {
        return $this->Lien;
    }

    /**
     * Set Telechargement
     *
     * @param string $telechargement
     * @return Projet
     */
    public function setTelechargement($telechargement)
    {
        $this->Telechargement = $telechargement;

        return $this;
    }

    /**
     * Get Telechargement
     *
     * @return string 
     */
    public function getTelechargement()
    {
        return $this->Telechargement;
    }

    /**
     * Set profil
     *
     * @param \Exia\CoreBundle\Entity\Profil $profil
     * @return Projet
     */
    public function setProfil(\Exia\CoreBundle\Entity\Profil $profil)
    {
        $this->profil = $profil;

        return $this;
    }

    /**
     * Get profil
     *
     * @return \Exia\CoreBundle\Entity\Profil 
     */
    public function getProfil()
    {
        return $this->profil;
    }
}
