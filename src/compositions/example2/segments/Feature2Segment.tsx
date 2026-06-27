import { ContentSlide } from "../../../components/ContentSlide";
import { CONTENT } from "../content";

export const Feature2Segment: React.FC = () => {
  return (
    <ContentSlide
      header={CONTENT.feature2Header}
      content={CONTENT.feature2Content}
    />
  );
};
