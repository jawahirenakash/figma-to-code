import SwiftUI

struct GeneratedView: View {
    var body: some View {
  VStack {
    VStack {
      Text("Design System")
          .frame(width: 200, height: 40)
          .background(Color(hex: "#1a1a1aff"))
          .foregroundColor(Color(hex: "#1a1a1aff"))
          .font(.system(size: 24))
          .fontWeight(.regular)
          .offset(x: 20, y: 20)
    }
        .frame(width: 375, height: 80)
        .background(Color(hex: "#f2f2f2ff"))
    VStack {
      VStack {
        Text("Component Card")
            .frame(width: 150, height: 24)
            .background(Color(hex: "#333333ff"))
            .foregroundColor(Color(hex: "#333333ff"))
            .font(.system(size: 18))
            .fontWeight(.regular)
            .offset(x: 20, y: 100)
        Text("This is a sample component card with some description text.")
            .frame(width: 295, height: 40)
            .background(Color(hex: "#808080ff"))
            .foregroundColor(Color(hex: "#808080ff"))
            .font(.system(size: 14))
            .fontWeight(.regular)
            .offset(x: 20, y: 130)
      }
          .frame(width: 335, height: 120)
          .background(Color(hex: "#ffffffff"))
          .overlay(
              RoundedRectangle(cornerRadius: 8)
                  .stroke(Color(hex: "#e6e6e6ff"), lineWidth: 1)
          )
          .offset(x: 20, y: 20)
      VStack {
        Text("Click Me")
            .frame(width: 60, height: 24)
            .background(Color(hex: "#ffffffff"))
            .foregroundColor(Color(hex: "#ffffffff"))
            .font(.system(size: 16))
            .fontWeight(.regular)
            .offset(x: 155, y: 92)
      }
          .frame(width: 335, height: 48)
          .background(Color(hex: "#3399ffff"))
          .cornerRadius(6)
          .offset(x: 20, y: 176)
    }
        .frame(width: 375, height: 600)
        .padding(.top, 20)
        .padding(.trailing, 20)
        .padding(.bottom, 20)
        .padding(.leading, 20)
        .spacing(16)
        .offset(x: 0, y: 80)
  }
    }
}

#Preview {
    GeneratedView()
}
