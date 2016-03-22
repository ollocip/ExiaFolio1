<?php

namespace Exia\CoreBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

class CategorieCompetencesType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
        ->add('categorie','text', array('required' => true))
        ->add('save','submit');
    }

    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Exia\CoreBundle\Entity\CategorieCompetences'
            ));
    }

    public function getName()
    {
        return 'exia_corebundle_categoriecompetences';
    }
}