import { ContentSlide } from "../../../components/ContentSlide";
import { CONTENT } from "../content";

export const InfoSegment: React.FC = () => {
  return (
    <ContentSlide header={CONTENT.infoHeader} content={CONTENT.infoContent} />
  );
};
