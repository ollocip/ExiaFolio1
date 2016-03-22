<?php

namespace Exia\CoreBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

class ProjetType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
        ->add('nom','text', array('required' => true))
        ->add('description','text', array('required' => true))
        ->add('illustration','text', array('required' => true))
        ->add('lien','text', array('required' => true))
        ->add('telechargement','text', array('required' => true))
        ->add('save','submit');
    }

    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Exia\CoreBundle\Entity\Projet'
            ));
    }

    public function getName()
    {
        return 'exia_corebundle_projet';
    }
}