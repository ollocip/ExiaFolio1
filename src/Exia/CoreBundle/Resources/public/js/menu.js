jQuery.fn.rotate = function(degrees) 
{
    $(this).css({'-webkit-transform' : 'rotate('+ degrees +'deg)',
                 '-moz-transform' : 'rotate('+ degrees +'deg)',
                 '-ms-transform' : 'rotate('+ degrees +'deg)',
                 'transform' : 'rotate('+ degrees +'deg)'});
    return $(this);
};

$('.dropdown_menu').click(function(e)
{
    if(!$(this).parent().find('.dropdown_sous_menu').is(':hidden'))
    {
        $(this).parent().find('.dropdown_sous_menu').slideUp('fast');
        $(this).find('.glyphicon-menu-down').rotate(0);
    }
    else
    {
        $(this).parent().find('.dropdown_sous_menu').slideDown('fast');
        $(this).find('.glyphicon-menu-down').rotate(180);
    }

    return false;
});