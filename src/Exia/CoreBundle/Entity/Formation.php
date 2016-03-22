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
     * Set Annee
     *
     * @param integer $annee
     * @return Formation
     */
    public function setAnnee($annee)
    {
        $this->Annee = $annee;

        return $this;
    }

    /**
     * Get Annee
     *
     * @return integer 
     */
    public function getAnnee()
    {
        return $this->Annee;
    }

    /**
     * Set Titre
     *
     * @param string $titre
     * @return Formation
     */
    public function setTitre($titre)
    {
        $this->Titre = $titre;

        return $this;
    }

    /**
     * Get Titre
     *
     * @return string 
     */
    public function getTitre()
    {
        return $this->Titre;
    }

    /**
     * Set Diplome
     *
     * @param string $diplome
     * @return Formation
     */
    public function setDiplome($diplome)
    {
        $this->Diplome = $diplome;

        return $this;
    }

    /**
     * Get Diplome
     *
     * @return string 
     */
    public function getDiplome()
    {
        return $this->Diplome;
    }

    /**
     * Set Lieu
     *
     * @param string $lieu
     * @return Formation
     */
    public function setLieu($lieu)
    {
        $this->Lieu = $lieu;

        return $this;
    }

    /**
     * Get Lieu
     *
     * @return string 
     */
    public function getLieu()
    {
        return $this->Lieu;
    }

    /**
     * Set Descriptif
     *
     * @param string $descriptif
     * @return Formation
     */
    public function setDescriptif($descriptif)
    {
        $this->Descriptif = $descriptif;

        return $this;
    }

    /**
     * Get Descriptif
     *
     * @return string 
     */
    public function getDescriptif()
    {
        return $this->Descriptif;
    }

    /**
     * Set profil
     *
     * @param \Exia\CoreBundle\Entity\Profil $profil
     * @return Formation
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
