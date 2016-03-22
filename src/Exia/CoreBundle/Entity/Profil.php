<?php
namespace Exia\CoreBundle\Entity;
use Doctrine\ORM\Mapping AS ORM;

/**
 * @ORM\Entity
 */
class Profil
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
    private $Prenom;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Adresse;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Mail;

    /**
     * @ORM\Column(type="integer", length=10, nullable=true)
     */
    private $Tel;

    /**
     * @ORM\Column(type="text", nullable=true)
     */
    private $Message;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Illustration;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $Theme ;
    /**
     * @ORM\Column(type="string", length=5, nullable=true)
     */
    private $AfficherNom ;
    /**
     * @ORM\Column(type="boolean", length=1, nullable=true)
     */
    private $AfficherPrenom ;
    /**
     * @ORM\Column(type="boolean", length=1, nullable=true)
     */
    private $AfficherAdresse ;
    /**
     * @ORM\Column(type="boolean", length=1, nullable=true)
     */
    private $AfficherMail ;
    /**
     * @ORM\Column(type="boolean", length=1, nullable=true)
     */
    private $AfficherTel ;
    /**
     * @ORM\Column(type="boolean", length=1, nullable=true)
     */
    private $AfficherIllustration ;
    /**
     * @ORM\Column(type="boolean", length=1, nullable=true)
     */
    private $AfficherMessage ;


    /**
     * @ORM\OneToOne(targetEntity="Exia\CoreBundle\Entity\User", inversedBy="profil")
     * @ORM\JoinColumn(name="user_id", referencedColumnName="id", nullable=false, unique=true)
     */
    private $user;

    /**
     * @ORM\OneToMany(targetEntity="Exia\CoreBundle\Entity\Formation", mappedBy="profil")
     */
    private $formation;

    /**
     * @ORM\OneToMany(targetEntity="Exia\CoreBundle\Entity\Projet", mappedBy="profil")
     */
    private $projet;

    /**
     * @ORM\OneToMany(targetEntity="Exia\CoreBundle\Entity\Experiences", mappedBy="profil")
     */
    private $experiences;

    /**
     * @ORM\OneToMany(targetEntity="Exia\CoreBundle\Entity\Competence", mappedBy="profil")
     */
    private $competence;
    /**
     * Constructor
     */
    public function __construct()
    {
        $this->formation = new \Doctrine\Common\Collections\ArrayCollection();
        $this->projet = new \Doctrine\Common\Collections\ArrayCollection();
        $this->experiences = new \Doctrine\Common\Collections\ArrayCollection();
        $this->competence = new \Doctrine\Common\Collections\ArrayCollection();
    }

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
     * @return Profil
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
     * Set Prenom
     *
     * @param string $prenom
     * @return Profil
     */
    public function setPrenom($prenom)
    {
        $this->Prenom = $prenom;

        return $this;
    }

    /**
     * Get Prenom
     *
     * @return string 
     */
    public function getPrenom()
    {
        return $this->Prenom;
    }

    /**
     * Set Adresse
     *
     * @param string $adresse
     * @return Profil
     */
    public function setAdresse($adresse)
    {
        $this->Adresse = $adresse;

        return $this;
    }

    /**
     * Get Adresse
     *
     * @return string 
     */
    public function getAdresse()
    {
        return $this->Adresse;
    }

    /**
     * Set Mail
     *
     * @param string $mail
     * @return Profil
     */
    public function setMail($mail)
    {
        $this->Mail = $mail;

        return $this;
    }

    /**
     * Get Mail
     *
     * @return string 
     */
    public function getMail()
    {
        return $this->Mail;
    }

    /**
     * Set Tel
     *
     * @param integer $tel
     * @return Profil
     */
    public function setTel($tel)
    {
        $this->Tel = $tel;

        return $this;
    }

    /**
     * Get Tel
     *
     * @return integer 
     */
    public function getTel()
    {
        return $this->Tel;
    }

    /**
     * Set Message
     *
     * @param string $message
     * @return Profil
     */
    public function setMessage($message)
    {
        $this->Message = $message;

        return $this;
    }

    /**
     * Get Message
     *
     * @return string 
     */
    public function getMessage()
    {
        return $this->Message;
    }

    /**
     * Set Illustration
     *
     * @param string $illustration
     * @return Profil
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
     * Set Theme
     *
     * @param string $theme
     * @return Profil
     */
    public function setTheme($theme)
    {
        $this->Theme = $theme;

        return $this;
    }

    /**
     * Get Theme
     *
     * @return string 
     */
    public function getTheme()
    {
        return $this->Theme;
    }

    /**
     * Add formation
     *
     * @param \Exia\CoreBundle\Entity\Formation $formation
     * @return Profil
     */
    public function addFormation(\Exia\CoreBundle\Entity\Formation $formation)
    {
        $this->formation[] = $formation;

        return $this;
    }

    /**
     * Remove formation
     *
     * @param \Exia\CoreBundle\Entity\Formation $formation
     */
    public function removeFormation(\Exia\CoreBundle\Entity\Formation $formation)
    {
        $this->formation->removeElement($formation);
    }

    /**
     * Get formation
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getFormation()
    {
        return $this->formation;
    }

    /**
     * Add projet
     *
     * @param \Exia\CoreBundle\Entity\Projet $projet
     * @return Profil
     */
    public function addProjet(\Exia\CoreBundle\Entity\Projet $projet)
    {
        $this->projet[] = $projet;

        return $this;
    }

    /**
     * Remove projet
     *
     * @param \Exia\CoreBundle\Entity\Projet $projet
     */
    public function removeProjet(\Exia\CoreBundle\Entity\Projet $projet)
    {
        $this->projet->removeElement($projet);
    }

    /**
     * Get projet
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getProjet()
    {
        return $this->projet;
    }

    /**
     * Add experiences
     *
     * @param \Exia\CoreBundle\Entity\Experiences $experiences
     * @return Profil
     */
    public function addExperience(\Exia\CoreBundle\Entity\Experiences $experiences)
    {
        $this->experiences[] = $experiences;

        return $this;
    }

    /**
     * Remove experiences
     *
     * @param \Exia\CoreBundle\Entity\Experiences $experiences
     */
    public function removeExperience(\Exia\CoreBundle\Entity\Experiences $experiences)
    {
        $this->experiences->removeElement($experiences);
    }

    /**
     * Get experiences
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getExperiences()
    {
        return $this->experiences;
    }

    /**
     * Add competence
     *
     * @param \Exia\CoreBundle\Entity\Competence $competence
     * @return Profil
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

    /**
     * Set user
     *
     * @param \Exia\CoreBundle\Entity\User $user
     * @return Profil
     */
    public function setUser(\Exia\CoreBundle\Entity\User $user)
    {
        $this->user = $user;

        return $this;
    }

    /**
     * Get user
     *
     * @return \Exia\CoreBundle\Entity\User 
     */
    public function getUser()
    {
        return $this->user;
    }

    /**
     * Set AfficherNom
     *
     * @param string $afficherNom
     * @return Profil
     */
    public function setAfficherNom($afficherNom)
    {
        $this->AfficherNom = $afficherNom;

        return $this;
    }

    /**
     * Get AfficherNom
     *
     * @return string 
     */
    public function getAfficherNom()
    {
        return $this->AfficherNom;
    }

    /**
     * Set AfficherPrenom
     *
     * @param boolean $afficherPrenom
     * @return Profil
     */
    public function setAfficherPrenom($afficherPrenom)
    {
        $this->AfficherPrenom = $afficherPrenom;

        return $this;
    }

    /**
     * Get AfficherPrenom
     *
     * @return boolean 
     */
    public function getAfficherPrenom()
    {
        return $this->AfficherPrenom;
    }

    /**
     * Set AfficherAdresse
     *
     * @param boolean $afficherAdresse
     * @return Profil
     */
    public function setAfficherAdresse($afficherAdresse)
    {
        $this->AfficherAdresse = $afficherAdresse;

        return $this;
    }

    /**
     * Get AfficherAdresse
     *
     * @return boolean 
     */
    public function getAfficherAdresse()
    {
        return $this->AfficherAdresse;
    }

    /**
     * Set AfficherMail
     *
     * @param boolean $afficherMail
     * @return Profil
     */
    public function setAfficherMail($afficherMail)
    {
        $this->AfficherMail = $afficherMail;

        return $this;
    }

    /**
     * Get AfficherMail
     *
     * @return boolean 
     */
    public function getAfficherMail()
    {
        return $this->AfficherMail;
    }

    /**
     * Set AfficherTel
     *
     * @param boolean $afficherTel
     * @return Profil
     */
    public function setAfficherTel($afficherTel)
    {
        $this->AfficherTel = $afficherTel;

        return $this;
    }

    /**
     * Get AfficherTel
     *
     * @return boolean 
     */
    public function getAfficherTel()
    {
        return $this->AfficherTel;
    }

    /**
     * Set AfficherIllustration
     *
     * @param boolean $afficherIllustration
     * @return Profil
     */
    public function setAfficherIllustration($afficherIllustration)
    {
        $this->AfficherIllustration = $afficherIllustration;

        return $this;
    }

    /**
     * Get AfficherIllustration
     *
     * @return boolean 
     */
    public function getAfficherIllustration()
    {
        return $this->AfficherIllustration;
    }

    /**
     * Set AfficherMessage
     *
     * @param boolean $afficherMessage
     * @return Profil
     */
    public function setAfficherMessage($afficherMessage)
    {
        $this->AfficherMessage = $afficherMessage;

        return $this;
    }

    /**
     * Get AfficherMessage
     *
     * @return boolean 
     */
    public function getAfficherMessage()
    {
        return $this->AfficherMessage;
    }
}
