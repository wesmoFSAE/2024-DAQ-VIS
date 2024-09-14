/*
 * File: components/Sponsors.tsx
 * Author: Hannah Murphy
 * Date: 2024-09-14
 * Description: An image array component for the sponsors page.
 *
 * Copyright (c) 2024 WESMO. All rights reserved.
 * This code is part of the  WESMO Data Acquisition and Visualisation Project.
 */

import * as React from "react";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";

interface Image {
  title: string;
  img: string;
  link: string;
}

interface IProps {
  images: Image[];
  width: number;
}

function SponsorRow({ images, width }: IProps) {
  return (
    <ImageList
      cols={5}
      sx={{
        marginLeft: "1rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {images.map((item, index) => (
        <ImageListItem
          key={item.img}
          sx={{
            objectFit: "contain",
            marginLeft: "1vw",
            marginRight: "1vw",
            width,
            maxHeight: 300,
            overflowY: "hidden",
          }}
        >
          <div
            style={{
              justifyContent: "center",
              objectFit: "cover",
              verticalAlign: "middle",
            }}
          >
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <img
                src={item.img}
                srcSet={item.img}
                alt={item.title}
                loading="lazy"
                style={{ maxWidth: width + "px", maxHeight: "300px" }}
              />
            </a>
          </div>
        </ImageListItem>
      ))}
    </ImageList>
  );
}

export default SponsorRow;
