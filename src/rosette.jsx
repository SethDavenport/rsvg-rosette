import React from 'react';
import fgeo from 'fgeo';
import * as RSVG from 'rsvg-path';

export const ConstructionModes = {
  OVERLAPPING_CIRCLES: 'overlapping-circles',
  LINEAR_CELLS: 'linear-cells',
  ARC_CELLS: 'arc-cells',
  Q_BEZIER_CELLS: 'quadratic-bezier-cells',
  CIRCLE_CELLS: 'circle-cells'
};

export class Rosette extends React.Component {
  render () {
    var rosette = new fgeo.rosette.Rosette(
        new fgeo.circle.Circle(
          new fgeo.point.Point(+this.props.cx, +this.props.cy),
          +this.props.guideRadius),
        +this.props.radius,
        +this.props.samples);

    return (
      <g>
        {this._renderGuideCircle(rosette)}
        {this._renderCircles(rosette)}
        {this._renderCells(rosette)}
      </g>
    );
  }

  _renderGuideCircle (rosette) {
    if (!this.props.showGuideCircle) {
      return null;
    }

    var cssClass = 'rosette__guide-circle';
    return (<circle cx={rosette.guideCircle.center.x}
      cy={rosette.guideCircle.center.y}
      r={rosette.guideCircle.radius}
      className={cssClass}/>);
  }

  _renderCircles (rosette) {
    if (this.props.constructionMode !== ConstructionModes.OVERLAPPING_CIRCLES) {
      return null;
    }

    var i = 0;
    return fgeo.rosette.computeCircles(rosette).map(
      function (circle) {
        var cssClass = 'rosette__circle rosette__circle-' + i++;
        return (<circle cx={circle.center.x}
          cy={circle.center.y}
          r={circle.radius}
          className={cssClass}/>);
      });
  }

  _renderCells (rosette) {
    var cssClass = 'rosette__cell rosette__cell';
    var positionalCssClassPrefix = 'rosette__cell-';
    var constructionMode = this.props.constructionMode;
    if (constructionMode === ConstructionModes.OVERLAPPING_CIRCLES) {
      return null;
    }

    var cellSize = this.props.cellSize;
    var cells = fgeo.rosette.computeCells(rosette);
    var result = [];

    for (let i=0; i<cells.length; ++i) {
      for (let j=0; j<cells[i].length; ++j) {
        let path = cells[i][j];

        if (cellSize > 0) {
          path = fgeo.path.resize(path, cellSize / 100);
        }

        if (constructionMode === ConstructionModes.CIRCLE_CELLS) {
          let centroid = fgeo.path.centroid(path);
          let medians = fgeo.path.computeMedians(path);
          let path2 = new fgeo.path.Path(path.vertices.concat(medians));

          result.push(<circle className={cssClass + ' ' + positionalCssClassPrefix + i + '-' + j}
            cx={centroid.x}
            cy={centroid.y}
            r={fgeo.path.computeMinDistance(path2, centroid)}/>);
        }
        else {
          result.push(<RSVG.Path geometry={path}
            className={cssClass + ' ' + positionalCssClassPrefix + i + '-' + j}
            segmentType={_toSegmentType(constructionMode)}
            arcRadius={rosette.radius}/>);
        }
      }
    }

    return result;
  }
}

function _toSegmentType(constructionMode) {
  switch (constructionMode) {
    case ConstructionModes.ARC_CELLS: return RSVG.SegmentTypes.ARC;
    case ConstructionModes.Q_BEZIER_CELLS: return RSVG.SegmentTypes.Q_BEZIER;
  }

  return RSVG.SegmentTypes.LINEAR;
}
