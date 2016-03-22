<?php

namespace Exia\CoreBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

class FormationType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
        ->add('annee','text', array('required' => true))
        ->add('titre','text', array('required' => true))
        ->add('diplome','text', array('required' => true))
        ->add('lieu','text', array('required' => true))
        ->add('descriptif','text', array('required' => true))
        ->add('save','submit');
    }

    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Exia\CoreBundle\Entity\Formation'
            ));
    }

    public function getName()
    {
        return 'exia_corebundle_formation';
    }
}