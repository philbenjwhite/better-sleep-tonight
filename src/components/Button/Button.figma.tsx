import { figma } from '@figma/code-connect';
import { Button } from './Button';

/**
 * Example Figma Code Connect mapping for the Button component.
 * Replace 'FIGMA_NODE_URL' with your actual Figma component URL.
 */
figma.connect(
  Button,
  '<FIGMA_BUTTONS_BUTTON>',
  {
    props: {
      variant: figma.enum('Variant', {
        Primary: 'primary',
        Secondary: 'secondary',
        Tertiary: 'tertiary',
      }),
      size: figma.enum('Size', {
        Small: 'small',
        Medium: 'medium',
        Large: 'large',
      }),
      children: figma.string('Label'),
    },
    example: (props) => <Button {...props} />,
  }
);
