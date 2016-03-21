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
     * @ORM\Column(type="integer", length=2, nullable=true)
     */
    private $Niveau;

    /**
     * @ORM\Column(type="boolean", nullable=true)
     */
    private $Afficher;

    /**
     * @ORM\ManyToOne(targetEntity="Exia\CoreBundle\Entity\Profil", inversedBy="competence")
     * @ORM\JoinColumn(name="profil_id", referencedColumnName="ID", nullable=false)
     */
    private $profil;

    /**
     * @ORM\ManyToOne(targetEntity="Exia\CoreBundle\Entity\CategorieCompetences", inversedBy="competence")
     * @ORM\JoinColumn(name="categorie_competences_id", referencedColumnName="id", nullable=false)
     */
    private $categorieCompetences;
}