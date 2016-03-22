<?php

namespace Exia\CoreBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

class ExperienceType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
        ->add('annee','text', array('required' => true))
        ->add('poste','text', array('required' => true))
        ->add('entreprise','text', array('required' => true))
        ->add('detail','text', array('required' => true))
        ->add('lieu','text', array('required' => true))
        ->add('competence', 'entity', array(
            'class'    => 'ExiaCoreBundle:Competence',
            'property' => 'Nom',
            'multiple' => false,
            'required' => false
))
        ->add('save','submit');
    }

    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Exia\CoreBundle\Entity\Experiences'
            ));
    }

    public function getName()
    {
        return 'exia_corebundle_experience';
    }
}