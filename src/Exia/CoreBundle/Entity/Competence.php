<?php
namespace Exia\CoreBundle\Entity;
use Doctrine\ORM\Mapping AS ORM;

/**
 * @ORM\Entity
 */
class Competence
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
    private $Niveau;

    /**
     * @ORM\Column(type="boolean", nullable=true)
     */
    private $Afficher;

    /**
     * @ORM\OneToMany(targetEntity="Exia\CoreBundle\Entity\Experiences", mappedBy="competence")
     */
    private $experiences;

    /**
     * @ORM\ManyToOne(targetEntity="Exia\CoreBundle\Entity\Profil", inversedBy="competence")
     * @ORM\JoinColumn(name="profil_id", referencedColumnName="id", nullable=false)
     */
    private $profil;

    /**
     * @ORM\ManyToOne(targetEntity="Exia\CoreBundle\Entity\CategorieCompetences", inversedBy="competence")
     * @ORM\JoinColumn(name="categorie_competences_id", referencedColumnName="id", nullable=false)
     */
    private $categorieCompetences;

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
     * @return Competence
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
     * Set Niveau
     *
     * @param integer $niveau
     * @return Competence
     */
    public function setNiveau($niveau)
    {
        $this->Niveau = $niveau;

        return $this;
    }

    /**
     * Get Niveau
     *
     * @return integer 
     */
    public function getNiveau()
    {
        return $this->Niveau;
    }

    /**
     * Set Afficher
     *
     * @param boolean $afficher
     * @return Competence
     */
    public function setAfficher($afficher)
    {
        $this->Afficher = $afficher;

        return $this;
    }

    /**
     * Get Afficher
     *
     * @return boolean 
     */
    public function getAfficher()
    {
        return $this->Afficher;
    }

    /**
     * Set profil
     *
     * @param \Exia\CoreBundle\Entity\Profil $profil
     * @return Competence
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

    /**
     * Set categorieCompetences
     *
     * @param \Exia\CoreBundle\Entity\CategorieCompetences $categorieCompetences
     * @return Competence
     */
    public function setCategorieCompetences(\Exia\CoreBundle\Entity\CategorieCompetences $categorieCompetences)
    {
        $this->categorieCompetences = $categorieCompetences;

        return $this;
    }

    /**
     * Get categorieCompetences
     *
     * @return \Exia\CoreBundle\Entity\CategorieCompetences 
     */
    public function getCategorieCompetences()
    {
        return $this->categorieCompetences;
    }
}
