// import { useNavigate } from "react-router-dom";

// export default function Tile({ number, title, subtitle, accent, to, onClick }) {
//   const navigate = useNavigate();

//   const handleClick = () => {
//     if (onClick) onClick();
//     else if (to) navigate(to);
//   };

//   return (
//     <button
//       type="button"
//       className="tile"
//       style={{ "--tile-accent": accent }}
//       onClick={handleClick}
//     >
//       <span className="tile__bar" />
//       <span className="tile__badge">{number}</span>
//       <span className="tile__text">
//         <span className="tile__title">{title}</span>
//         <span className="tile__subtitle">{subtitle}</span>
//       </span>
//       <span className="tile__chevron">&rsaquo;</span>
//     </button>
//   );
// }


import { useNavigate } from "react-router-dom";
import { DoodleLeaf } from "./Doodles.jsx";

export default function Tile({ number, title, subtitle, accent, to, onClick }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) onClick();
    else if (to) navigate(to);
  };

  return (
    <button type="button" className="tile2" style={{ "--tile-accent": accent }} onClick={handleClick}>
      <span className="tile2__bubble">
        <span className="tile2__number">{number}</span>
        <DoodleLeaf className="tile2__leaf" />
      </span>
      <span className="tile2__text">
        <span className="tile2__title">{title}</span>
        <span className="tile2__subtitle">{subtitle}</span>
      </span>
      <span className="tile2__arrow">&rarr;</span>
    </button>
  );
}