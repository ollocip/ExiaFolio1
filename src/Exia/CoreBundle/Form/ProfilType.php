<?php

namespace Exia\CoreBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;

class ProfilType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
        ->add('nom','text', array('required' => true))
        ->add('afficherNom','checkbox',array('required' => false))
        ->add('prenom','text', array('required' => true))
        ->add('afficherPrenom','checkbox',array('required' => false))
        ->add('adresse','text', array('required' => true))
        ->add('afficherAdresse','checkbox',array('required' => false))
        ->add('mail','email', array('required' => true))
        ->add('afficherMail','checkbox',array('required' => false))
        ->add('tel','text', array('required' => true))
        ->add('afficherTel','checkbox',array('required' => false))
        ->add('message','text', array('required' => false))
        ->add('afficherMessage','checkbox',array('required' => false))
        ->add('illustration','text', array('required' => false))
        ->add('afficherIllustration','checkbox',array('required' => false))
        ->add('theme', ChoiceType::class, array(
        'required' => true,
        'choices'  => array(
        'Theme classique' => 'Theme classique',
        'Theme secondaire' => 'Theme secondaire',
       

    )))
        ->add('save','submit');
    }

    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Exia\CoreBundle\Entity\Profil'
            ));
    }

    public function getName()
    {
        return 'exia_corebundle_profil';
    }
}