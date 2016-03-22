<?php
// src/Exia/PortFolioBundle/Entity/User.php

namespace Exia\CoreBundle\Entity;

use FOS\UserBundle\Entity\User as BaseUser;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity
 * @ORM\Table(name="User")
 */
class User extends BaseUser
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    protected $id;

    /**
     * @ORM\OneToOne(targetEntity="Exia\CoreBundle\Entity\Profil", mappedBy="user")
     */
    private $profil;
  

    public function __construct()
    {
        parent::__construct();
        // your own logic
    }

    /**
     * Set profil
     *
     * @param \Exia\CoreBundle\Entity\Profil $profil
     * @return User
     */
    public function setProfil(\Exia\CoreBundle\Entity\Profil $profil = null)
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
