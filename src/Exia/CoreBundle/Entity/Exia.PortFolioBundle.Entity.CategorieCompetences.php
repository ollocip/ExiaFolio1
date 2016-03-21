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
}