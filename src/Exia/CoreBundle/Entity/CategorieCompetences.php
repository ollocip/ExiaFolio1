<?php
namespace Exia\CoreBundle\Entity;
use Doctrine\ORM\Mapping AS ORM;

/**
 * @ORM\Entity
 */
class CategorieCompetences
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Categorie;

    /**
     * @ORM\OneToMany(targetEntity="Exia\CoreBundle\Entity\Competence", mappedBy="categorieCompetences")
     */
    private $competence;
    /**
     * Constructor
     */
    public function __construct()
    {
        $this->competence = new \Doctrine\Common\Collections\ArrayCollection();
    }

    /**
     * Get id
     *
     * @return integer 
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set Categorie
     *
     * @param string $categorie
     * @return CategorieCompetences
     */
    public function setCategorie($categorie)
    {
        $this->Categorie = $categorie;

        return $this;
    }

    /**
     * Get Categorie
     *
     * @return string 
     */
    public function getCategorie()
    {
        return $this->Categorie;
    }

    /**
     * Add competence
     *
     * @param \Exia\CoreBundle\Entity\Competence $competence
     * @return CategorieCompetences
     */
    public function addCompetence(\Exia\CoreBundle\Entity\Competence $competence)
    {
        $this->competence[] = $competence;

        return $this;
    }

    /**
     * Remove competence
     *
     * @param \Exia\CoreBundle\Entity\Competence $competence
     */
    public function removeCompetence(\Exia\CoreBundle\Entity\Competence $competence)
    {
        $this->competence->removeElement($competence);
    }

    /**
     * Get competence
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getCompetence()
    {
        return $this->competence;
    }
}
